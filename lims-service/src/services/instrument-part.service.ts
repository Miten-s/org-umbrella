import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { InstrumentPart } from "../models/instrument-part.model";
import * as repo from "../repo/instrument-part.repo";
import { AppError } from "../types/common.types";

export const createInstrumentPart = async (data: any) => {
  return await repo.createInstrumentPartRepo(data);
};

export const updateInstrumentPart = async (id: string, data: any) => {
  const existing = await repo.getInstrumentPartByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInstrumentPartRepo(id, data);
};

export const getInstrumentPartById = async (id: string) => {
  const part = await repo.getInstrumentPartByIdRepo(id);
  if (!part) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  return part;
};

export const getAllInstrumentParts = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInstrumentPartsRepo(skip, limit, filters);
  return { instrumentParts: rows, total: count };
};

export const deleteInstrumentPart = async (id: string, deletedBy: string) => {
  const existing = await repo.getInstrumentPartByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInstrumentPartRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: InstrumentPart, ids, entityName: "INSTRUMENT_PART", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: InstrumentPart, ids, labelField: "partId", entityName: "INSTRUMENT_PART", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getInstrumentPartByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await InstrumentPart.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "INSTRUMENT_PART", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getInstrumentPartByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("INSTRUMENT_PART", id, page, limit);
};
