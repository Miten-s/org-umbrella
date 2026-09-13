import CsvFunctionalRisk from "../models/csv-functional-risk.model";
import CsvFunctionalSpec from "../models/csv-functional-spec.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { syncRtmMatrix } from "./rtm.service";

export const createFunctionalRisk = async (
  data: {
    fsId: string;
    hazardMode: string;
    severity: string;
    probability: string;
    residualRisk: string;
  },
  actor: AuditActor
): Promise<CsvFunctionalRisk> => {
  const spec = await CsvFunctionalSpec.findByPk(data.fsId);
  if (!spec) {
    throw {
      statusCode: 404,
      message: `Functional Spec ${data.fsId} not found.`
    };
  }

  const risk = await CsvFunctionalRisk.create({
    fsId: data.fsId,
    hazardMode: data.hazardMode,
    severity: data.severity,
    probability: data.probability,
    residualRisk: data.residualRisk
  });

  await writeAudit({
    entityName: "csv_functional_risks",
    entityId: risk.id,
    action: "CREATE",
    newValue: risk.toJSON(),
    actor
  });

  // Find linked project & trigger RTM sync
  const requirement = await CsvUserRequirement.findByPk(spec.ursId);
  if (requirement) {
    const project = await CsvProject.findByPk(requirement.projectId);
    if (project) {
      await project.update({ currentPhase: "RISK_ASSESSMENT" });
      await syncRtmMatrix(project.id);
    }
  }

  return risk;
};

export const getRisksByProjectId = async (
  projectId: string
): Promise<CsvFunctionalRisk[]> => {
  const requirements = await CsvUserRequirement.findAll({
    where: { projectId },
    attributes: ["id"]
  });
  const ursIds = requirements.map((r) => r.id);

  const specs = await CsvFunctionalSpec.findAll({
    where: { ursId: ursIds },
    attributes: ["id"]
  });
  const fsIds = specs.map((s) => s.id);

  return CsvFunctionalRisk.findAll({
    where: { fsId: fsIds },
    order: [["created_at", "ASC"]]
  });
};
