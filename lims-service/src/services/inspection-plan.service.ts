import * as repo from "../repo/inspection-plan.repo";
import { AppError } from "../types/common.types";

export const createInspectionPlan = async (data: any) => {
  return await repo.createInspectionPlanRepo(data);
};

export const updateInspectionPlan = async (id: string, data: any) => {
  const existing = await repo.getInspectionPlanByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Inspection Plan not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInspectionPlanRepo(id, data);
};

export const getInspectionPlanById = async (id: string) => {
  const plan = await repo.getInspectionPlanByIdRepo(id);
  if (!plan) {
    const error: AppError = new Error("Inspection Plan not found");
    error.statusCode = 404;
    throw error;
  }
  return plan;
};

export const getAllInspectionPlans = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInspectionPlansRepo(skip, limit, filters);
  return { inspectionPlans: rows, total: count };
};

export const deleteInspectionPlan = async (id: string, deletedBy: string) => {
  const existing = await repo.getInspectionPlanByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Inspection Plan not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInspectionPlanRepo(id, deletedBy);
};
