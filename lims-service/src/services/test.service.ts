import * as repo from "../repo/test.repo";
import { AppError } from "../types/common.types";

export const createTest = async (data: any) => {
  return await repo.createTestRepo(data);
};

export const updateTest = async (id: string, data: any) => {
  const existing = await repo.getTestByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateTestRepo(id, data);
};

export const getTestById = async (id: string) => {
  const test = await repo.getTestByIdRepo(id);
  if (!test) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  return test;
};

export const getAllTests = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestsRepo(skip, limit, filters);
  return { tests: rows, total: count };
};

export const deleteTest = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestRepo(id, deletedBy);
};
