import * as childRepo from "../repo/stock-parameter.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Stock } from "../models/stock.model";
import * as repo from "../repo/stock.repo";
import { AppError } from "../types/common.types";

export const createStock = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createStockRepo(data, t);
    if (data.stockParameters && Array.isArray(data.stockParameters)) {
      for (const child of data.stockParameters) {
        child.stockId = parent.id;
        await childRepo.createStockParameterRepo(child, t);
      }
    }
    return await repo.getStockByIdRepo(parent.id, t);
  });
};

export const updateStock = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getStockByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateStockRepo(id, data, t);
    if (data.stockParameters && Array.isArray(data.stockParameters)) {
      const incomingIds = data.stockParameters.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).stockParameters || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteStockParameterRepo(ec.id, userId, t);
        }
      }
      for (const child of data.stockParameters) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateStockParameterRepo(childId, child, t);
        } else {
          child.stockId = id;
          await childRepo.createStockParameterRepo(child, t);
        }
      }
    }
    return await repo.getStockByIdRepo(id, t);
  });
};

export const getStockById = async (id: string) => {
  const stock = await repo.getStockByIdRepo(id);
  if (!stock) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  return stock;
};

export const getAllStock = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStockRepo(skip, limit, filters);
  return { stock: rows, total: count };
};

export const deleteStock = async (id: string, deletedBy: string) => {
  const existing = await repo.getStockByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Stock not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStockRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Stock, ids, entityName: "STOCK", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Stock, ids, labelField: "name", entityName: "STOCK", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getStockByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Stock.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "STOCK", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getStockByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("STOCK", id, page, limit);
};
