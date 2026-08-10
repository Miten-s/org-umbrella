import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Lot } from "../models/lot.model";
import * as repo from "../repo/lot.repo";
import { AppError } from "../types/common.types";

export const createLot = async (data: any) => {
  return await repo.createLotRepo(data);
};

export const updateLot = async (id: string, data: any) => {
  const existing = await repo.getLotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateLotRepo(id, data);
};

export const getLotById = async (id: string) => {
  const lot = await repo.getLotByIdRepo(id);
  if (!lot) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  return lot;
};

export const getAllLots = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllLotsRepo(skip, limit, filters);
  return { lots: rows, total: count };
};

export const deleteLot = async (id: string, deletedBy: string) => {
  const existing = await repo.getLotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteLotRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Lot, ids, entityName: "LOT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Lot, ids, labelField: "lotId", entityName: "LOT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getLotByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Lot.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "LOT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getLotByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("LOT", id, page, limit);
};
