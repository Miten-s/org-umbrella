import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Customer } from "../models/customer.model";
import * as repo from "../repo/customer.repo";
import { AppError } from "../types/common.types";

export const createCustomer = async (data: any) => {
  return await repo.createCustomerRepo(data);
};

export const updateCustomer = async (id: string, data: any) => {
  const existing = await repo.getCustomerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateCustomerRepo(id, data);
};

export const getCustomerById = async (id: string) => {
  const customer = await repo.getCustomerByIdRepo(id);
  if (!customer) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return customer;
};

export const getAllCustomers = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllCustomersRepo(skip, limit, filters);
  return { customers: rows, total: count };
};

export const deleteCustomer = async (id: string, deletedBy: string) => {
  const existing = await repo.getCustomerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteCustomerRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Customer, ids, entityName: "CUSTOMER", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Customer, ids, labelField: "name", entityName: "CUSTOMER", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getCustomerByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Customer.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "CUSTOMER", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getCustomerByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("CUSTOMER", id, page, limit);
};
