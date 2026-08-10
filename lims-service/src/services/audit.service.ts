import { AuditAction } from "../models/audit-log.model";
import { AuditContext } from "../types/common.types";
import { logError } from "../configs/logger.config";
import * as repo from "../repo/audit.repo";

export const createAuditLog = async (context: AuditContext): Promise<void> => {
  try {
    await repo.createAuditLogRepo({
      entityName: context.entityName,
      entityId: context.entityId,
      action: context.action as AuditAction,
      oldValue: context.oldValue ?? null,
      newValue: context.newValue ?? null,
      changeReason: context.changeReason ?? null,
      performedBy: context.performedBy,
      performedByName: context.performedByName,
      performedAt: new Date()
    });

} catch (error) {
    logError("Failed to write audit log", { context, error }, "createAuditLog", "audit.service.ts");
  }
};

export const getAuditLogsForEntity = async (
  entityName: string,
  entityId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
  const { rows: logs, count: total } = await repo.getAuditLogsForEntityRepo(entityName, entityId, skip, limit);
  return { logs, total };
};

export const getAllAuditLogs = async (
  page: number = 1,
  limit: number = 20,
  filters?: { entityName?: string; performedBy?: string; action?: string }
) => {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (filters?.entityName) where.entityName = filters.entityName;
  if (filters?.performedBy) where.performedBy = filters.performedBy;
  if (filters?.action) where.action = filters.action;

  const { rows: logs, count: total } = await repo.getAllAuditLogsRepo(skip, limit, where);
  return { logs, total };
};
