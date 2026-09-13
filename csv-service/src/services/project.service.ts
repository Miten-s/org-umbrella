import CsvProject from "../models/csv-project.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvValidationPlan from "../models/csv-validation-plan.model";
import CsvApplication from "../models/csv-application.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export const createProject = async (
  data: {
    appId: string;
    gxpChangeControlId?: string;
    projectTitle: string;
    currentPhase?: string;
    status?: string;
  },
  actor: AuditActor
): Promise<CsvProject> => {
  const project = await CsvProject.create({
    appId: data.appId,
    gxpChangeControlId: data.gxpChangeControlId || null,
    projectTitle: data.projectTitle,
    currentPhase: data.currentPhase || "INTAKE",
    status: data.status || "INTAKE"
  });

  await writeAudit({
    entityName: "csv_projects",
    entityId: project.id,
    action: "CREATE",
    newValue: project.toJSON(),
    actor
  });

  return project;
};

export const getProjects = async (): Promise<CsvProject[]> => {
  return CsvProject.findAll({
    include: [{ model: CsvApplication, as: "application" }],
    order: [["created_at", "DESC"]]
  });
};

export const getProjectById = async (
  id: string
): Promise<CsvProject | null> => {
  return CsvProject.findByPk(id, {
    include: [
      { model: CsvApplication, as: "application" },
      { model: CsvUserRequirement, as: "userRequirements" },
      { model: CsvValidationPlan, as: "validationPlan" }
    ]
  });
};
