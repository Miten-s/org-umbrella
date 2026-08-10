import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { InspectionPersonnel } from "../models/inspection-personnel.model";
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

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: InspectionPersonnel, ids, entityName: "INSPECTION_PERSONNEL", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: InspectionPersonnel, ids, labelField: "id", entityName: "INSPECTION_PERSONNEL", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getInspectionPersonnelByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await InspectionPersonnel.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "INSPECTION_PERSONNEL", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getInspectionPersonnelByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("INSPECTION_PERSONNEL", id, page, limit);
};
