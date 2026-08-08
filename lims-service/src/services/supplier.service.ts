import * as repo from "../repo/supplier.repo";
import { AppError } from "../types/common.types";

export const createSupplier = async (data: any) => {
  return await repo.createSupplierRepo(data);
};

export const updateSupplier = async (id: string, data: any) => {
  const existing = await repo.getSupplierByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateSupplierRepo(id, data);
};

export const getSupplierById = async (id: string) => {
  const supplier = await repo.getSupplierByIdRepo(id);
  if (!supplier) {
    const error: AppError = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }
  return supplier;
};

export const getAllSuppliers = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSuppliersRepo(skip, limit, filters);
  return { suppliers: rows, total: count };
};

export const deleteSupplier = async (id: string, deletedBy: string) => {
  const existing = await repo.getSupplierByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSupplierRepo(id, deletedBy);
};
