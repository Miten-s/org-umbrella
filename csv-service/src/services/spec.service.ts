import CsvFunctionalSpec from "../models/csv-functional-spec.model";
import CsvConfigSpec from "../models/csv-config-spec.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { syncRtmMatrix } from "./rtm.service";

export const createFunctionalSpec = async (
  data: {
    ursId: string;
    fsCode: string;
    flowDetails?: string;
    configSpecs?: Array<{ configCode: string; parameters?: object }>;
  },
  actor: AuditActor
): Promise<CsvFunctionalSpec> => {
  const requirement = await CsvUserRequirement.findByPk(data.ursId);
  if (!requirement) {
    throw {
      statusCode: 404,
      message: `User Requirement ${data.ursId} not found.`
    };
  }

  const functionalSpec = await CsvFunctionalSpec.create({
    ursId: data.ursId,
    fsCode: data.fsCode,
    flowDetails: data.flowDetails || ""
  });

  await writeAudit({
    entityName: "csv_functional_specs",
    entityId: functionalSpec.id,
    action: "CREATE",
    newValue: functionalSpec.toJSON(),
    actor
  });

  // Create optional linked Config Specs
  if (data.configSpecs && data.configSpecs.length > 0) {
    for (const cfg of data.configSpecs) {
      const configSpec = await CsvConfigSpec.create({
        fsId: functionalSpec.id,
        configCode: cfg.configCode,
        parameters: cfg.parameters || {}
      });
      await writeAudit({
        entityName: "csv_config_specs",
        entityId: configSpec.id,
        action: "CREATE",
        newValue: configSpec.toJSON(),
        actor
      });
    }
  }

  // Update Project Current Phase
  const project = await CsvProject.findByPk(requirement.projectId);
  if (project) {
    await project.update({ currentPhase: "DESIGN_SPEC" });
    // Trigger RTM Sync
    await syncRtmMatrix(project.id);
  }

  return functionalSpec;
};

export const getFunctionalSpecsByProjectId = async (
  projectId: string
): Promise<CsvFunctionalSpec[]> => {
  const requirements = await CsvUserRequirement.findAll({
    where: { projectId },
    attributes: ["id"]
  });
  const ursIds = requirements.map((r) => r.id);

  return CsvFunctionalSpec.findAll({
    where: { ursId: ursIds },
    include: [{ model: CsvConfigSpec, as: "configSpecs" }],
    order: [["created_at", "ASC"]]
  });
};
