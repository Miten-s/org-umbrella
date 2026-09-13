import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export const createRequirement = async (
  data: {
    projectId: string;
    ursCode: string;
    title: string;
    description?: string;
    gxpFlag?: boolean;
  },
  actor: AuditActor
): Promise<CsvUserRequirement> => {
  const project = await CsvProject.findByPk(data.projectId);
  if (!project) {
    throw {
      statusCode: 404,
      message: `Project with ID ${data.projectId} not found.`
    };
  }

  const requirement = await CsvUserRequirement.create({
    projectId: data.projectId,
    ursCode: data.ursCode,
    title: data.title,
    description: data.description || "",
    gxpFlag: data.gxpFlag !== undefined ? data.gxpFlag : true
  });

  // Write ALCOA+ Audit Log
  await writeAudit({
    entityName: "csv_user_requirements",
    entityId: requirement.id,
    action: "CREATE",
    newValue: requirement.toJSON(),
    actor
  });

  // Update Project Current Phase to REQUIREMENTS if currently INTAKE
  if (project.currentPhase === "INTAKE") {
    await project.update({
      currentPhase: "REQUIREMENTS",
      status: "IN_PROGRESS"
    });
  }

  return requirement;
};

export const getRequirementsByProjectId = async (
  projectId: string
): Promise<CsvUserRequirement[]> => {
  return CsvUserRequirement.findAll({
    where: { projectId },
    order: [["created_at", "ASC"]]
  });
};

export const updateRequirement = async (
  id: string,
  data: Partial<{
    ursCode: string;
    title: string;
    description: string;
    gxpFlag: boolean;
  }>,
  actor: AuditActor
): Promise<CsvUserRequirement> => {
  const requirement = await CsvUserRequirement.findByPk(id);
  if (!requirement) {
    throw { statusCode: 404, message: `Requirement with ID ${id} not found.` };
  }

  const oldValue = requirement.toJSON();
  await requirement.update(data);
  const newValue = requirement.toJSON();

  await writeAudit({
    entityName: "csv_user_requirements",
    entityId: requirement.id,
    action: "UPDATE",
    oldValue,
    newValue,
    actor
  });

  return requirement;
};

export const deleteRequirement = async (
  id: string,
  actor: AuditActor
): Promise<void> => {
  const requirement = await CsvUserRequirement.findByPk(id);
  if (!requirement) {
    throw { statusCode: 404, message: `Requirement with ID ${id} not found.` };
  }

  const oldValue = requirement.toJSON();
  await requirement.destroy();

  await writeAudit({
    entityName: "csv_user_requirements",
    entityId: id,
    action: "DELETE",
    oldValue,
    actor
  });
};
