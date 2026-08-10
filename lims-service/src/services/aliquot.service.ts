import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Aliquot } from "../models/aliquot.model";
import * as repo from "../repo/aliquot.repo";
import { getStockBatchByIdRepo, updateStockBatchRepo } from "../repo/stock-batch.repo";
import { AppError } from "../types/common.types";

export const createAliquot = async (data: any) => {
  // Validate that the parent batch has enough amount to split
  const parentBatch = await getStockBatchByIdRepo(data.batchId);
  if (!parentBatch) {
    const error: AppError = new Error("Parent Stock Batch not found");
    error.statusCode = 404;
    throw error;
  }

  if (parentBatch.currentAmount < data.initialAmount) {
    const error: AppError = new Error("Insufficient stock in parent batch to create aliquot");
    error.statusCode = 400;
    throw error;
  }

  // Transactionally deduct from parent and create aliquot (skipped explicit transaction object for simplicity here, but recommended for prod)
  await updateStockBatchRepo(parentBatch.id, { currentAmount: parentBatch.currentAmount - data.initialAmount });

  return await repo.createAliquotRepo(data);
};

export const updateAliquot = async (id: string, data: any) => {
  const existing = await repo.getAliquotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Aliquot not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateAliquotRepo(id, data);
};

export const getAliquotById = async (id: string) => {
  const aliquot = await repo.getAliquotByIdRepo(id);
  if (!aliquot) {
    const error: AppError = new Error("Aliquot not found");
    error.statusCode = 404;
    throw error;
  }
  return aliquot;
};

export const getAllAliquots = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllAliquotsRepo(skip, limit, filters);
  return { aliquots: rows, total: count };
};

export const deleteAliquot = async (id: string, deletedBy: string) => {
  const existing = await repo.getAliquotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Aliquot not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteAliquotRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Aliquot, ids, entityName: "ALIQUOT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Aliquot, ids, labelField: "id", entityName: "ALIQUOT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getAliquotByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Aliquot.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "ALIQUOT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getAliquotByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("ALIQUOT", id, page, limit);
};
