import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Instrument } from "../models/instrument.model";
import * as repo from "../repo/instrument.repo";
import { AppError } from "../types/common.types";

export const createInstrument = async (data: any) => {
  return await repo.createInstrumentRepo(data);
};

export const updateInstrument = async (id: string, data: any) => {
  const existing = await repo.getInstrumentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInstrumentRepo(id, data);
};

export const getInstrumentById = async (id: string) => {
  const instrument = await repo.getInstrumentByIdRepo(id);
  if (!instrument) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  return instrument;
};

export const getAllInstruments = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInstrumentsRepo(skip, limit, filters);
  return { instruments: rows, total: count };
};

export const deleteInstrument = async (id: string, deletedBy: string) => {
  const existing = await repo.getInstrumentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInstrumentRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Instrument, ids, entityName: "INSTRUMENT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Instrument, ids, labelField: "id", entityName: "INSTRUMENT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getInstrumentByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Instrument.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "INSTRUMENT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getInstrumentByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("INSTRUMENT", id, page, limit);
};
