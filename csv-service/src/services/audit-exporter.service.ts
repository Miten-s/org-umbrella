import { Response } from "express";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import CsvProject from "../models/csv-project.model";
import CsvApplication from "../models/csv-application.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvFunctionalSpec from "../models/csv-functional-spec.model";
import CsvConfigSpec from "../models/csv-config-spec.model";
import CsvFunctionalRisk from "../models/csv-functional-risk.model";
import CsvRtmMatrix from "../models/csv-rtm-matrix.model";
import CsvTestProtocol from "../models/csv-test-protocol.model";
import CsvTestCase from "../models/csv-test-case.model";
import CsvTestStep from "../models/csv-test-step.model";
import CsvTestExecution from "../models/csv-test-execution.model";
import CsvEvidence from "../models/csv-evidence.model";
import CsvDiscrepancy from "../models/csv-discrepancy.model";
import CsvVsrReport from "../models/csv-vsr-report.model";
import CsvSignature from "../models/csv-signature.model";
import CsvAuditLog from "../models/csv-audit-log.model";

export const generateAuditPackageZip = async (
  projectId: string,
  res: Response
): Promise<void> => {
  const project = await CsvProject.findByPk(projectId, {
    include: [{ model: CsvApplication, as: "application" }]
  });

  if (!project) {
    res.status(404).json({ error: `Project ${projectId} not found.` });
    return;
  }

  // Fetch all validation data for export
  const userRequirements = await CsvUserRequirement.findAll({
    where: { projectId }
  });
  const ursIds = userRequirements.map((r) => r.id);

  const functionalSpecs = await CsvFunctionalSpec.findAll({
    where: { ursId: ursIds },
    include: [{ model: CsvConfigSpec, as: "configSpecs" }]
  });
  const fsIds = functionalSpecs.map((s) => s.id);

  const functionalRisks = await CsvFunctionalRisk.findAll({
    where: { fsId: fsIds }
  });

  const rtmEntries = await CsvRtmMatrix.findAll({ where: { projectId } });

  const testProtocols = await CsvTestProtocol.findAll({
    where: { projectId },
    include: [
      {
        model: CsvTestCase,
        as: "testCases",
        include: [{ model: CsvTestStep, as: "testSteps" }]
      }
    ]
  });

  const executions = await CsvTestExecution.findAll({
    include: [
      {
        model: CsvTestStep,
        as: "testStep",
        required: true,
        include: [
          {
            model: CsvTestCase,
            as: "testCase",
            required: true,
            include: [
              {
                model: CsvTestProtocol,
                as: "testProtocol",
                where: { projectId },
                required: true
              }
            ]
          }
        ]
      },
      { model: CsvEvidence, as: "evidences" }
    ]
  });

  const executionIds = executions.map((e) => e.id);
  const discrepancies = await CsvDiscrepancy.findAll({
    where: { executionId: executionIds }
  });

  const vsr = await CsvVsrReport.findOne({ where: { projectId } });
  const signatures = await CsvSignature.findAll({
    where: { entityId: projectId }
  });
  const auditLogs = await CsvAuditLog.findAll({
    where: { entityId: projectId }
  });

  // Setup ZIP Streaming Response
  const archive = archiver("zip", { zlib: { level: 9 } });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="audit-package-${project.gxpChangeControlId || project.id}.zip"`
  );

  archive.pipe(res);

  // Append JSON Document Manifests
  archive.append(JSON.stringify(project.toJSON(), null, 2), {
    name: "project_summary.json"
  });
  archive.append(
    JSON.stringify(
      userRequirements.map((r) => r.toJSON()),
      null,
      2
    ),
    { name: "user_requirements.json" }
  );
  archive.append(
    JSON.stringify(
      functionalSpecs.map((s) => s.toJSON()),
      null,
      2
    ),
    { name: "functional_specifications.json" }
  );
  archive.append(
    JSON.stringify(
      functionalRisks.map((rk) => rk.toJSON()),
      null,
      2
    ),
    { name: "risk_assessment.json" }
  );
  archive.append(
    JSON.stringify(
      rtmEntries.map((rtm) => rtm.toJSON()),
      null,
      2
    ),
    { name: "rtm_matrix.json" }
  );
  archive.append(
    JSON.stringify(
      testProtocols.map((p) => p.toJSON()),
      null,
      2
    ),
    { name: "test_protocols_and_cases.json" }
  );
  archive.append(
    JSON.stringify(
      executions.map((e) => e.toJSON()),
      null,
      2
    ),
    { name: "test_executions.json" }
  );
  archive.append(
    JSON.stringify(
      discrepancies.map((d) => d.toJSON()),
      null,
      2
    ),
    { name: "discrepancy_log.json" }
  );
  archive.append(
    JSON.stringify(
      {
        vsr: vsr?.toJSON() || null,
        signatures: signatures.map((s) => s.toJSON())
      },
      null,
      2
    ),
    { name: "vsr_report_and_signatures.json" }
  );
  archive.append(
    JSON.stringify(
      auditLogs.map((a) => a.toJSON()),
      null,
      2
    ),
    { name: "audit_trail.json" }
  );

  // Append Evidence Files with Checksum Manifest
  const evidenceManifest: Array<{ file: string; sha256: string }> = [];
  for (const exec of executions) {
    if (exec.evidences) {
      for (const ev of exec.evidences) {
        evidenceManifest.push({ file: ev.filePath, sha256: ev.sha256Hash });
        if (fs.existsSync(ev.filePath)) {
          const fileName = path.basename(ev.filePath);
          archive.file(ev.filePath, { name: `evidence/${fileName}` });
        }
      }
    }
  }

  archive.append(JSON.stringify(evidenceManifest, null, 2), {
    name: "evidence/checksum_manifest.json"
  });

  await archive.finalize();
};
