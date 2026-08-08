import * as repo from "../repo/stock-batch.repo";
import { AppError } from "../types/common.types";

export const createStockBatch = async (data: any) => {
  return await repo.createStockBatchRepo(data);
};

export const updateStockBatch = async (id: string, data: any) => {
  const existing = await repo.getStockBatchByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Batch not found");
    error.statusCode = 404;
    throw error;
  }

  // Prevent updating currentAmount manually here if consumption is meant to be handled by a specific logic,
  // but for raw CRUD, we allow it.
  
  return await repo.updateStockBatchRepo(id, data);
};

export const getStockBatchById = async (id: string) => {
  const batch = await repo.getStockBatchByIdRepo(id);
  if (!batch) {
    const error: AppError = new Error("Stock Batch not found");
    error.statusCode = 404;
    throw error;
  }
  return batch;
};

export const getAllStockBatches = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStockBatchesRepo(skip, limit, filters);
  return { stockBatches: rows, total: count };
};

export const deleteStockBatch = async (id: string, deletedBy: string) => {
  const existing = await repo.getStockBatchByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Batch not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStockBatchRepo(id, deletedBy);
};
