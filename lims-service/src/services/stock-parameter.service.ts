import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { StockParameter } from "../models/stock-parameter.model";
import * as repo from "../repo/stock-parameter.repo";
import { AppError } from "../types/common.types";

export const createStockParameter = async (data: any) => {
  return await repo.createStockParameterRepo(data);
};

export const updateStockParameter = async (id: string, data: any) => {
  const existing = await repo.getStockParameterByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateStockParameterRepo(id, data);
};

export const getStockParameterById = async (id: string) => {
  const param = await repo.getStockParameterByIdRepo(id);
  if (!param) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  return param;
};

export const getAllStockParameters = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStockParametersRepo(skip, limit, filters);
  return { stockParameters: rows, total: count };
};

export const deleteStockParameter = async (id: string, deletedBy: string) => {
  const existing = await repo.getStockParameterByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock Parameter not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStockParameterRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: StockParameter, ids, entityName: "STOCK_PARAMETER", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: StockParameter, ids, labelField: "id", entityName: "STOCK_PARAMETER", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getStockParameterByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await StockParameter.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "STOCK_PARAMETER", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getStockParameterByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("STOCK_PARAMETER", id, page, limit);
};
