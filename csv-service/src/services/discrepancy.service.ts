import CsvDiscrepancy from "../models/csv-discrepancy.model";
import CsvTestExecution from "../models/csv-test-execution.model";
import CsvTestStep from "../models/csv-test-step.model";
import CsvTestCase from "../models/csv-test-case.model";
import CsvTestProtocol from "../models/csv-test-protocol.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export const getDiscrepancies = async (filters?: {
  bugSeverity?: string;
  fixStatus?: string;
}): Promise<CsvDiscrepancy[]> => {
  const where: any = {};
  if (filters?.bugSeverity) where.bugSeverity = filters.bugSeverity;
  if (filters?.fixStatus) where.fixStatus = filters.fixStatus;

  return CsvDiscrepancy.findAll({
    where,
    include: [
      {
        model: CsvTestExecution,
        as: "execution",
        include: [
          {
            model: CsvTestStep,
            as: "testStep",
            include: [
              {
                model: CsvTestCase,
                as: "testCase",
                include: [{ model: CsvTestProtocol, as: "testProtocol" }]
              }
            ]
          }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });
};

export const getDiscrepanciesByProjectId = async (
  projectId: string
): Promise<CsvDiscrepancy[]> => {
  const protocols = await CsvTestProtocol.findAll({
    where: { projectId },
    attributes: ["id"]
  });
  const protocolIds = protocols.map((p) => p.id);

  const testCases = await CsvTestCase.findAll({
    where: { protocolId: protocolIds },
    attributes: ["id"]
  });
  const caseIds = testCases.map((c) => c.id);

  const steps = await CsvTestStep.findAll({
    where: { testCaseId: caseIds },
    attributes: ["id"]
  });
  const stepIds = steps.map((s) => s.id);

  const executions = await CsvTestExecution.findAll({
    where: { stepId: stepIds },
    attributes: ["id"]
  });
  const executionIds = executions.map((e) => e.id);

  return CsvDiscrepancy.findAll({
    where: { executionId: executionIds },
    include: [
      {
        model: CsvTestExecution,
        as: "execution",
        include: [{ model: CsvTestStep, as: "testStep" }]
      }
    ],
    order: [["created_at", "DESC"]]
  });
};

export const getDiscrepancyById = async (
  id: string
): Promise<CsvDiscrepancy | null> => {
  return CsvDiscrepancy.findByPk(id, {
    include: [
      {
        model: CsvTestExecution,
        as: "execution",
        include: [{ model: CsvTestStep, as: "testStep" }]
      }
    ]
  });
};

export const updateDiscrepancy = async (
  id: string,
  data: Partial<{
    bugSeverity: string;
    rootCause: string;
    fixStatus: string;
  }>,
  actor: AuditActor
): Promise<CsvDiscrepancy> => {
  const discrepancy = await CsvDiscrepancy.findByPk(id);
  if (!discrepancy) {
    throw { statusCode: 404, message: `Discrepancy with ID ${id} not found.` };
  }

  const oldValue = discrepancy.toJSON();
  await discrepancy.update(data);
  const newValue = discrepancy.toJSON();

  await writeAudit({
    entityName: "csv_discrepancies",
    entityId: discrepancy.id,
    action: "UPDATE",
    oldValue,
    newValue,
    actor
  });

  return discrepancy;
};

export const closeDiscrepancy = async (
  id: string,
  actor: AuditActor
): Promise<CsvDiscrepancy> => {
  const discrepancy = await CsvDiscrepancy.findByPk(id, {
    include: [{ model: CsvTestExecution, as: "execution" }]
  });
  if (!discrepancy) {
    throw { statusCode: 404, message: `Discrepancy with ID ${id} not found.` };
  }

  const oldValue = discrepancy.toJSON();
  await discrepancy.update({ fixStatus: "CLOSED" });
  const newValue = discrepancy.toJSON();

  await writeAudit({
    entityName: "csv_discrepancies",
    entityId: discrepancy.id,
    action: "UPDATE",
    oldValue,
    newValue,
    actor
  });

  return discrepancy;
};
