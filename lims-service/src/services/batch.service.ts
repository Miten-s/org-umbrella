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
