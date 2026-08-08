import * as repo from "../repo/specification.repo";
import { AppError } from "../types/common.types";

export const createSpecification = async (data: any) => {
  return await repo.createSpecificationRepo(data);
};

export const updateSpecification = async (id: string, data: any) => {
  const existing = await repo.getSpecificationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateSpecificationRepo(id, data);
};

export const getSpecificationById = async (id: string) => {
  const spec = await repo.getSpecificationByIdRepo(id);
  if (!spec) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  return spec;
};

export const getAllSpecifications = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSpecificationsRepo(skip, limit, filters);
  return { specifications: rows, total: count };
};

export const deleteSpecification = async (id: string, deletedBy: string) => {
  const existing = await repo.getSpecificationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSpecificationRepo(id, deletedBy);
};
