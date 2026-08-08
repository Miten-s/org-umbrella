import AuditLog, { AuditAction } from "../models/audit-log.model";

export const createAuditLogRepo = async (data: {
  entityName: string;
  entityId: string;
  action: AuditAction;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  changeReason: string | null;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
}) => {
  return await AuditLog.create(data);
};

export const getAuditLogsForEntityRepo = async (
  entityName: string,
  entityId: string,
  skip: number,
  limit: number
) => {
  return await AuditLog.findAndCountAll({
    where: { entityName, entityId },
    order: [["performed_at", "DESC"]],
    offset: skip,
    limit
  });
};

export const getAllAuditLogsRepo = async (
  skip: number,
  limit: number,
  whereFilters: any
) => {
  return await AuditLog.findAndCountAll({
    where: whereFilters,
    order: [["performed_at", "DESC"]],
    offset: skip,
    limit
  });
};
