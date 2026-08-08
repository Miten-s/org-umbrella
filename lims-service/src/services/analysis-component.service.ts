import * as repo from "../repo/analysis-component.repo";
import { AppError } from "../types/common.types";

export const createAnalysisComponent = async (data: any) => {
  return await repo.createAnalysisComponentRepo(data);
};

export const updateAnalysisComponent = async (id: string, data: any) => {
  const existing = await repo.getAnalysisComponentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateAnalysisComponentRepo(id, data);
};

export const getAnalysisComponentById = async (id: string) => {
  const component = await repo.getAnalysisComponentByIdRepo(id);
  if (!component) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  return component;
};

export const getAllAnalysisComponents = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllAnalysisComponentsRepo(skip, limit, filters);
  return { analysisComponents: rows, total: count };
};

export const deleteAnalysisComponent = async (id: string, deletedBy: string) => {
  const existing = await repo.getAnalysisComponentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteAnalysisComponentRepo(id, deletedBy);
};
