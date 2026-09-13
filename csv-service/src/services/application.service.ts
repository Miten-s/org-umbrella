import CsvApplication from "../models/csv-application.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export const createApplication = async (
  data: { appCode: string; name: string; gxpClassification?: string },
  actor: AuditActor
): Promise<CsvApplication> => {
  const application = await CsvApplication.create({
    appCode: data.appCode,
    name: data.name,
    gxpClassification: data.gxpClassification || "GXP"
  });

  await writeAudit({
    entityName: "csv_applications",
    entityId: application.id,
    action: "CREATE",
    newValue: application.toJSON(),
    actor
  });

  return application;
};

export const getApplications = async (): Promise<CsvApplication[]> => {
  return CsvApplication.findAll({ order: [["created_at", "DESC"]] });
};

export const getApplicationById = async (
  id: string
): Promise<CsvApplication | null> => {
  return CsvApplication.findByPk(id);
};
