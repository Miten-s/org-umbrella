import CsvTestExecution from "../models/csv-test-execution.model";
import CsvEvidence from "../models/csv-evidence.model";
import CsvTestStep from "../models/csv-test-step.model";
import CsvTestCase from "../models/csv-test-case.model";
import CsvTestProtocol from "../models/csv-test-protocol.model";
import CsvProject from "../models/csv-project.model";
import CsvDiscrepancy from "../models/csv-discrepancy.model";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { calculateSha256 } from "../utils/file-upload.util";
import { syncRtmMatrix } from "./rtm.service";

export interface ExecutionResult {
  execution: CsvTestExecution;
  evidence: CsvEvidence | null;
  discrepancy: CsvDiscrepancy | null;
}

export const executeTestStep = async (
  data: {
    stepId: string;
    actualResult: string;
    status: "PASS" | "FAIL";
  },
  filePath: string | undefined,
  actor: AuditActor
): Promise<ExecutionResult> => {
  const step = await CsvTestStep.findByPk(data.stepId);
  if (!step) {
    throw { statusCode: 404, message: `Test Step ${data.stepId} not found.` };
  }

  const execution = await CsvTestExecution.create({
    stepId: data.stepId,
    actualResult: data.actualResult,
    status: data.status,
    executedBy: actor.id,
    executedAt: new Date()
  });

  await writeAudit({
    entityName: "csv_test_executions",
    entityId: execution.id,
    action: "EXECUTE",
    newValue: execution.toJSON(),
    actor
  });

  let evidence: CsvEvidence | null = null;
  if (filePath) {
    const sha256Hash = await calculateSha256(filePath);
    evidence = await CsvEvidence.create({
      executionId: execution.id,
      filePath,
      sha256Hash
    });

    await writeAudit({
      entityName: "csv_evidences",
      entityId: evidence.id,
      action: "CREATE",
      newValue: evidence.toJSON(),
      actor
    });
  }

  let discrepancy: CsvDiscrepancy | null = null;
  if (data.status === "FAIL") {
    const discCode = `DISC-${Date.now().toString().slice(-6)}`;
    discrepancy = await CsvDiscrepancy.create({
      executionId: execution.id,
      discCode,
      bugSeverity: "MAJOR",
      rootCause: null,
      fixStatus: "OPEN"
    });

    await writeAudit({
      entityName: "csv_discrepancies",
      entityId: discrepancy.id,
      action: "CREATE",
      newValue: discrepancy.toJSON(),
      actor
    });
  }

  // Update Project Current Phase & Sync RTM
  const testCase = await CsvTestCase.findByPk(step.testCaseId);
  if (testCase) {
    const protocol = await CsvTestProtocol.findByPk(testCase.protocolId);
    if (protocol) {
      const project = await CsvProject.findByPk(protocol.projectId);
      if (project) {
        await project.update({ currentPhase: "TEST_EXECUTION" });
        await syncRtmMatrix(project.id);
      }
    }
  }

  return { execution, evidence, discrepancy };
};

export const getExecutionsByStepId = async (
  stepId: string
): Promise<CsvTestExecution[]> => {
  return CsvTestExecution.findAll({
    where: { stepId },
    include: [
      { model: CsvEvidence, as: "evidences" },
      { model: CsvDiscrepancy, as: "discrepancies" }
    ],
    order: [["executed_at", "DESC"]]
  });
};
