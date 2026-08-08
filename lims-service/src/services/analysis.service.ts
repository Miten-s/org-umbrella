import * as repo from "../repo/analysis.repo";
import { AppError } from "../types/common.types";

export const createAnalysis = async (data: any) => {
  return await repo.createAnalysisRepo(data);
};

export const updateAnalysis = async (id: string, data: any) => {
  const existing = await repo.getAnalysisByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateAnalysisRepo(id, data);
};

export const getAnalysisById = async (id: string) => {
  const analysis = await repo.getAnalysisByIdRepo(id);
  if (!analysis) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  return analysis;
};

export const getAllAnalyses = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllAnalysesRepo(skip, limit, filters);
  return { analyses: rows, total: count };
};

export const deleteAnalysis = async (id: string, deletedBy: string) => {
  const existing = await repo.getAnalysisByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteAnalysisRepo(id, deletedBy);
};
