import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Supplier } from "../models/supplier.model";
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

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Supplier, ids, entityName: "SUPPLIER", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Supplier, ids, labelField: "name", entityName: "SUPPLIER", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getSupplierByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Supplier.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "SUPPLIER", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getSupplierByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("SUPPLIER", id, page, limit);
};
