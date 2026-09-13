import CsvRtmMatrix from "../models/csv-rtm-matrix.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvFunctionalSpec from "../models/csv-functional-spec.model";
import CsvFunctionalRisk from "../models/csv-functional-risk.model";
import CsvTestCase from "../models/csv-test-case.model";

export interface RtmSummary {
  projectId: string;
  totalRequirements: number;
  coveredCount: number;
  partiallyCoveredCount: number;
  uncoveredCount: number;
  coveragePercentage: number;
  matrixEntries: CsvRtmMatrix[];
}

export const syncRtmMatrix = async (projectId: string): Promise<RtmSummary> => {
  const requirements = await CsvUserRequirement.findAll({
    where: { projectId }
  });

  for (const urs of requirements) {
    const specs = await CsvFunctionalSpec.findAll({
      where: { ursId: urs.id }
    });

    if (specs.length === 0) {
      // Requirement has no Functional Spec yet -> UNCOVERED entry
      await upsertRtmEntry({
        projectId,
        ursId: urs.id,
        fsId: null,
        riskId: null,
        testCaseId: null,
        coverageStatus: "UNCOVERED"
      });
    } else {
      for (const spec of specs) {
        const risks = await CsvFunctionalRisk.findAll({
          where: { fsId: spec.id }
        });

        if (risks.length === 0) {
          await upsertRtmEntry({
            projectId,
            ursId: urs.id,
            fsId: spec.id,
            riskId: null,
            testCaseId: null,
            coverageStatus: "PARTIALLY_COVERED"
          });
        } else {
          for (const risk of risks) {
            await upsertRtmEntry({
              projectId,
              ursId: urs.id,
              fsId: spec.id,
              riskId: risk.id,
              testCaseId: null,
              coverageStatus: "PARTIALLY_COVERED"
            });
          }
        }
      }
    }
  }

  return getRtmMatrixByProjectId(projectId);
};

const upsertRtmEntry = async (data: {
  projectId: string;
  ursId: string;
  fsId: string | null;
  riskId: string | null;
  testCaseId: string | null;
  coverageStatus: string;
}) => {
  const existing = await CsvRtmMatrix.findOne({
    where: {
      projectId: data.projectId,
      ursId: data.ursId,
      fsId: data.fsId,
      riskId: data.riskId
    }
  });

  if (existing) {
    await existing.update({
      testCaseId: data.testCaseId || existing.testCaseId,
      coverageStatus: data.testCaseId ? "COVERED" : data.coverageStatus
    });
  } else {
    await CsvRtmMatrix.create({
      projectId: data.projectId,
      ursId: data.ursId,
      fsId: data.fsId,
      riskId: data.riskId,
      testCaseId: data.testCaseId,
      coverageStatus: data.testCaseId ? "COVERED" : data.coverageStatus
    });
  }
};

export const getRtmMatrixByProjectId = async (
  projectId: string
): Promise<RtmSummary> => {
  const entries = await CsvRtmMatrix.findAll({
    where: { projectId },
    include: [
      { model: CsvUserRequirement, as: "userRequirement" },
      { model: CsvFunctionalSpec, as: "functionalSpec" },
      { model: CsvFunctionalRisk, as: "functionalRisk" },
      { model: CsvTestCase, as: "testCase" }
    ],
    order: [["created_at", "ASC"]]
  });

  const totalRequirements = await CsvUserRequirement.count({
    where: { projectId }
  });

  let coveredCount = 0;
  let partiallyCoveredCount = 0;
  let uncoveredCount = 0;

  for (const entry of entries) {
    if (entry.coverageStatus === "COVERED") coveredCount++;
    else if (entry.coverageStatus === "PARTIALLY_COVERED")
      partiallyCoveredCount++;
    else uncoveredCount++;
  }

  const coveragePercentage =
    totalRequirements > 0
      ? Math.round((coveredCount / totalRequirements) * 100)
      : 0;

  return {
    projectId,
    totalRequirements,
    coveredCount,
    partiallyCoveredCount,
    uncoveredCount,
    coveragePercentage,
    matrixEntries: entries
  };
};
