import * as repo from "../repo/study.repo";
import { AppError } from "../types/common.types";

export const createStudy = async (data: any) => {
  return await repo.createStudyRepo(data);
};

export const updateStudy = async (id: string, data: any) => {
  const existing = await repo.getStudyByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateStudyRepo(id, data);
};

export const getStudyById = async (id: string) => {
  const study = await repo.getStudyByIdRepo(id);
  if (!study) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  return study;
};

export const getAllStudies = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStudiesRepo(skip, limit, filters);
  return { studies: rows, total: count };
};

export const deleteStudy = async (id: string, deletedBy: string) => {
  const existing = await repo.getStudyByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStudyRepo(id, deletedBy);
};
