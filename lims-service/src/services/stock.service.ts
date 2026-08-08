import * as repo from "../repo/stock.repo";
import { AppError } from "../types/common.types";

export const createStock = async (data: any) => {
  return await repo.createStockRepo(data);
};

export const updateStock = async (id: string, data: any) => {
  const existing = await repo.getStockByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateStockRepo(id, data);
};

export const getStockById = async (id: string) => {
  const stock = await repo.getStockByIdRepo(id);
  if (!stock) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  return stock;
};

export const getAllStock = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStockRepo(skip, limit, filters);
  return { stock: rows, total: count };
};

export const deleteStock = async (id: string, deletedBy: string) => {
  const existing = await repo.getStockByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStockRepo(id, deletedBy);
};
