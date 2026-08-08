import * as repo from "../repo/test-window.repo";
import { AppError } from "../types/common.types";

export const createTestWindow = async (data: any) => {
  return await repo.createTestWindowRepo(data);
};

export const updateTestWindow = async (id: string, data: any) => {
  const existing = await repo.getTestWindowByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Window not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateTestWindowRepo(id, data);
};

export const getTestWindowById = async (id: string) => {
  const testWindow = await repo.getTestWindowByIdRepo(id);
  if (!testWindow) {
    const error: AppError = new Error("Test Window not found");
    error.statusCode = 404;
    throw error;
  }
  return testWindow;
};

export const getAllTestWindows = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestWindowsRepo(skip, limit, filters);
  return { testWindows: rows, total: count };
};

export const deleteTestWindow = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestWindowByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Window not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestWindowRepo(id, deletedBy);
};
