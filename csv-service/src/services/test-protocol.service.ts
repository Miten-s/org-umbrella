import CsvTestProtocol from "../models/csv-test-protocol.model";
import CsvTestCase from "../models/csv-test-case.model";
import CsvTestStep from "../models/csv-test-step.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { syncRtmMatrix } from "./rtm.service";

export const createTestProtocol = async (
  data: { projectId: string; protocolType: string; status?: string },
  actor: AuditActor
): Promise<CsvTestProtocol> => {
  const project = await CsvProject.findByPk(data.projectId);
  if (!project) {
    throw { statusCode: 404, message: `Project ${data.projectId} not found.` };
  }

  const protocol = await CsvTestProtocol.create({
    projectId: data.projectId,
    protocolType: data.protocolType,
    status: data.status || "DRAFT"
  });

  await writeAudit({
    entityName: "csv_test_protocols",
    entityId: protocol.id,
    action: "CREATE",
    newValue: protocol.toJSON(),
    actor
  });

  await project.update({ currentPhase: "TESTING_PREP" });

  return protocol;
};

export const createTestCase = async (
  data: { protocolId: string; tcCode: string; title: string },
  actor: AuditActor
): Promise<CsvTestCase> => {
  const protocol = await CsvTestProtocol.findByPk(data.protocolId);
  if (!protocol) {
    throw {
      statusCode: 404,
      message: `Protocol ${data.protocolId} not found.`
    };
  }

  const testCase = await CsvTestCase.create({
    protocolId: data.protocolId,
    tcCode: data.tcCode,
    title: data.title
  });

  await writeAudit({
    entityName: "csv_test_cases",
    entityId: testCase.id,
    action: "CREATE",
    newValue: testCase.toJSON(),
    actor
  });

  await syncRtmMatrix(protocol.projectId);

  return testCase;
};

export const createTestStep = async (
  data: {
    testCaseId: string;
    stepNum: number;
    action: string;
    expectedResult: string;
  },
  actor: AuditActor
): Promise<CsvTestStep> => {
  const testCase = await CsvTestCase.findByPk(data.testCaseId);
  if (!testCase) {
    throw {
      statusCode: 404,
      message: `Test Case ${data.testCaseId} not found.`
    };
  }

  const step = await CsvTestStep.create({
    testCaseId: data.testCaseId,
    stepNum: data.stepNum,
    action: data.action,
    expectedResult: data.expectedResult
  });

  await writeAudit({
    entityName: "csv_test_steps",
    entityId: step.id,
    action: "CREATE",
    newValue: step.toJSON(),
    actor
  });

  return step;
};

export const getProtocolsByProjectId = async (
  projectId: string
): Promise<CsvTestProtocol[]> => {
  return CsvTestProtocol.findAll({
    where: { projectId },
    include: [
      {
        model: CsvTestCase,
        as: "testCases",
        include: [{ model: CsvTestStep, as: "testSteps" }]
      }
    ],
    order: [["created_at", "ASC"]]
  });
};
