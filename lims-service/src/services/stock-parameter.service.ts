import * as repo from "../repo/stock-parameter.repo";
import { AppError } from "../types/common.types";

export const createStockParameter = async (data: any) => {
  return await repo.createStockParameterRepo(data);
};

export const updateStockParameter = async (id: string, data: any) => {
  const existing = await repo.getStockParameterByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateStockParameterRepo(id, data);
};

export const getStockParameterById = async (id: string) => {
  const param = await repo.getStockParameterByIdRepo(id);
  if (!param) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  return param;
};

export const getAllStockParameters = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStockParametersRepo(skip, limit, filters);
  return { stockParameters: rows, total: count };
};

export const deleteStockParameter = async (id: string, deletedBy: string) => {
  const existing = await repo.getStockParameterByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStockParameterRepo(id, deletedBy);
};
