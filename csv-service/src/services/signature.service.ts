import crypto from "crypto";
import CsvProject from "../models/csv-project.model";
import CsvSignature from "../models/csv-signature.model";
import CsvVsrReport from "../models/csv-vsr-report.model";
import { getRtmMatrixByProjectId } from "./rtm.service";
import { getDiscrepanciesByProjectId } from "./discrepancy.service";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { publishEvent } from "./kafka.service";

export interface ReadinessResult {
  ready: boolean;
  coveragePercentage: number;
  openDiscrepancyCount: number;
  reasons: string[];
}

export const verifyProjectReadiness = async (
  projectId: string
): Promise<ReadinessResult> => {
  const rtmSummary = await getRtmMatrixByProjectId(projectId);
  const discrepancies = await getDiscrepanciesByProjectId(projectId);

  const openDiscrepancies = discrepancies.filter(
    (d) => d.fixStatus !== "CLOSED"
  );

  const reasons: string[] = [];
  if (rtmSummary.coveragePercentage < 100) {
    reasons.push(
      `RTM Coverage is ${rtmSummary.coveragePercentage}% (Must be 100% for QA Sign-off).`
    );
  }
  if (openDiscrepancies.length > 0) {
    reasons.push(
      `Found ${openDiscrepancies.length} open discrepancy/bug(s) that must be closed before sign-off.`
    );
  }

  return {
    ready: reasons.length === 0,
    coveragePercentage: rtmSummary.coveragePercentage,
    openDiscrepancyCount: openDiscrepancies.length,
    reasons
  };
};

export const createVsrReport = async (
  data: {
    projectId: string;
    summaryText: string;
    releaseRecommendation: string;
  },
  actor: AuditActor
): Promise<CsvVsrReport> => {
  const project = await CsvProject.findByPk(data.projectId);
  if (!project) {
    throw { statusCode: 404, message: `Project ${data.projectId} not found.` };
  }

  let vsr = await CsvVsrReport.findOne({
    where: { projectId: data.projectId }
  });
  if (vsr) {
    const oldValue = vsr.toJSON();
    await vsr.update({
      summaryText: data.summaryText,
      releaseRecommendation: data.releaseRecommendation
    });
    await writeAudit({
      entityName: "csv_vsr_reports",
      entityId: vsr.id,
      action: "UPDATE",
      oldValue,
      newValue: vsr.toJSON(),
      actor
    });
  } else {
    vsr = await CsvVsrReport.create({
      projectId: data.projectId,
      summaryText: data.summaryText,
      releaseRecommendation: data.releaseRecommendation,
      status: "DRAFT"
    });
    await writeAudit({
      entityName: "csv_vsr_reports",
      entityId: vsr.id,
      action: "CREATE",
      newValue: vsr.toJSON(),
      actor
    });
  }

  return vsr;
};

export const signProjectAndApprove = async (
  data: {
    projectId: string;
    signatureMeaning: string;
    password?: string;
    mfaCode?: string;
  },
  actor: AuditActor
): Promise<{
  signature: CsvSignature;
  project: CsvProject;
  vsr: CsvVsrReport;
}> => {
  const project = await CsvProject.findByPk(data.projectId);
  if (!project) {
    throw { statusCode: 404, message: `Project ${data.projectId} not found.` };
  }

  // 1. Verify Readiness Gate (100% Coverage & 0 Bugs)
  const readiness = await verifyProjectReadiness(data.projectId);
  if (!readiness.ready) {
    throw {
      statusCode: 400,
      message: `21 CFR Part 11 Sign-off Gate Failed: ${readiness.reasons.join(" ")}`
    };
  }

  // 2. Compute SHA-256 Cryptographic Signature Hash
  const signaturePayload = `${project.id}:${actor.id}:${data.signatureMeaning}:${Date.now()}`;
  const checksumHash = crypto
    .createHash("sha256")
    .update(signaturePayload)
    .digest("hex");

  // 3. Create 21 CFR Part 11 Signature Entry
  const signature = await CsvSignature.create({
    entityType: "VSR_REPORT",
    entityId: project.id,
    signerId: actor.id,
    signatureMeaning:
      data.signatureMeaning ||
      "I approve this CSV Validation Summary Report and authorize release.",
    signedAt: new Date(),
    checksumHash
  });

  await writeAudit({
    entityName: "csv_signatures",
    entityId: signature.id,
    action: "SIGN",
    newValue: signature.toJSON(),
    actor
  });

  // 4. Lock Project to READ_ONLY & Set Phase to VALIDATED
  await project.update({
    status: "READ_ONLY",
    currentPhase: "VALIDATED"
  });

  // 5. Update VSR Status to APPROVED
  let vsr = await CsvVsrReport.findOne({ where: { projectId: project.id } });
  if (!vsr) {
    vsr = await CsvVsrReport.create({
      projectId: project.id,
      summaryText:
        "System validated with 100% traceability coverage and zero open discrepancies.",
      releaseRecommendation: "APPROVED_FOR_PRODUCTION",
      status: "APPROVED"
    });
  } else {
    await vsr.update({ status: "APPROVED" });
  }

  // 6. Emit Outbound Kafka Event: csv.validation.approved
  await publishEvent("csv.validation.approved", {
    changeControlId: project.gxpChangeControlId,
    projectId: project.id,
    status: "APPROVED",
    timestamp: new Date().toISOString()
  });

  return { signature, project, vsr };
};
