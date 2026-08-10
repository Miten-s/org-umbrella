import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Batch } from "../models/batch.model";
import * as repo from "../repo/batch.repo";
import { AppError } from "../types/common.types";

export const createBatch = async (data: any) => {
  return await repo.createBatchRepo(data);
};

export const updateBatch = async (id: string, data: any) => {
  const existing = await repo.getBatchByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Batch not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateBatchRepo(id, data);
};

export const getBatchById = async (id: string) => {
  const batch = await repo.getBatchByIdRepo(id);
  if (!batch) {
    const error: AppError = new Error("Batch not found");
    error.statusCode = 404;
    throw error;
  }
  return batch;
};

export const getAllBatches = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllBatchesRepo(skip, limit, filters);
  return { batches: rows, total: count };
};

export const deleteBatch = async (id: string, deletedBy: string) => {
  const existing = await repo.getBatchByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Batch not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteBatchRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Batch, ids, entityName: "BATCH", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Batch, ids, labelField: "batchId", entityName: "BATCH", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getBatchByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Batch.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "BATCH", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getBatchByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("BATCH", id, page, limit);
};
