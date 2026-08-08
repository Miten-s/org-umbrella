import * as repo from "../repo/test-group-item.repo";
import { AppError } from "../types/common.types";

export const createTestGroupItem = async (data: any) => {
  return await repo.createTestGroupItemRepo(data);
};

export const updateTestGroupItem = async (id: string, data: any) => {
  const existing = await repo.getTestGroupItemByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateTestGroupItemRepo(id, data);
};

export const getTestGroupItemById = async (id: string) => {
  const item = await repo.getTestGroupItemByIdRepo(id);
  if (!item) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const getAllTestGroupItems = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestGroupItemsRepo(skip, limit, filters);
  return { testGroupItems: rows, total: count };
};

export const deleteTestGroupItem = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestGroupItemByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestGroupItemRepo(id, deletedBy);
};
