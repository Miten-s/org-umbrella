import * as repo from "../repo/inspection-personnel.repo";
import { AppError } from "../types/common.types";

export const createInspectionPersonnel = async (data: any) => {
  return await repo.createInspectionPersonnelRepo(data);
};

export const updateInspectionPersonnel = async (id: string, data: any) => {
  const existing = await repo.getInspectionPersonnelByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Inspection Personnel not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInspectionPersonnelRepo(id, data);
};

export const getInspectionPersonnelById = async (id: string) => {
  const personnel = await repo.getInspectionPersonnelByIdRepo(id);
  if (!personnel) {
    const error: AppError = new Error("Inspection Personnel not found");
    error.statusCode = 404;
    throw error;
  }
  return personnel;
};

export const getAllInspectionPersonnel = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInspectionPersonnelRepo(skip, limit, filters);
  return { inspectionPersonnel: rows, total: count };
};

export const deleteInspectionPersonnel = async (id: string, deletedBy: string) => {
  const existing = await repo.getInspectionPersonnelByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Inspection Personnel not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInspectionPersonnelRepo(id, deletedBy);
};
