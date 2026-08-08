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
