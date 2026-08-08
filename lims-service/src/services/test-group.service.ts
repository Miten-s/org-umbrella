import * as repo from "../repo/test-group.repo";
import { AppError } from "../types/common.types";

export const createTestGroup = async (data: any) => {
  return await repo.createTestGroupRepo(data);
};

export const updateTestGroup = async (id: string, data: any) => {
  const existing = await repo.getTestGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateTestGroupRepo(id, data);
};

export const getTestGroupById = async (id: string) => {
  const group = await repo.getTestGroupByIdRepo(id);
  if (!group) {
    const error: AppError = new Error("Test Group not found");
    error.statusCode = 404;
    throw error;
  }
  return group;
};

export const getAllTestGroups = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestGroupsRepo(skip, limit, filters);
  return { testGroups: rows, total: count };
};

export const deleteTestGroup = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestGroupRepo(id, deletedBy);
};
