import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { SpecLimit } from "../models/spec-limit.model";
import * as repo from "../repo/spec-limit.repo";
import { AppError } from "../types/common.types";

export const createSpecLimit = async (data: any) => {
  return await repo.createSpecLimitRepo(data);
};

export const updateSpecLimit = async (id: string, data: any) => {
  const existing = await repo.getSpecLimitByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Spec Limit not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateSpecLimitRepo(id, data);
};

export const getSpecLimitById = async (id: string) => {
  const limit = await repo.getSpecLimitByIdRepo(id);
  if (!limit) {
    const error: AppError = new Error("Spec Limit not found");
    error.statusCode = 404;
    throw error;
  }
  return limit;
};

export const getAllSpecLimits = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSpecLimitsRepo(skip, limit, filters);
  return { specLimits: rows, total: count };
};

export const deleteSpecLimit = async (id: string, deletedBy: string) => {
  const existing = await repo.getSpecLimitByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Spec Limit not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSpecLimitRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: SpecLimit, ids, entityName: "SPEC_LIMIT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: SpecLimit, ids, labelField: "id", entityName: "SPEC_LIMIT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getSpecLimitByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await SpecLimit.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "SPEC_LIMIT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getSpecLimitByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("SPEC_LIMIT", id, page, limit);
};
