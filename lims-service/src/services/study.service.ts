import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Study } from "../models/study.model";
import * as repo from "../repo/study.repo";
import { AppError } from "../types/common.types";

export const createStudy = async (data: any) => {
  return await repo.createStudyRepo(data);
};

export const updateStudy = async (id: string, data: any) => {
  const existing = await repo.getStudyByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateStudyRepo(id, data);
};

export const getStudyById = async (id: string) => {
  const study = await repo.getStudyByIdRepo(id);
  if (!study) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  return study;
};

export const getAllStudies = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllStudiesRepo(skip, limit, filters);
  return { studies: rows, total: count };
};

export const deleteStudy = async (id: string, deletedBy: string) => {
  const existing = await repo.getStudyByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Study not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteStudyRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Study, ids, entityName: "STUDY", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Study, ids, labelField: "name", entityName: "STUDY", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getStudyByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Study.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "STUDY", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getStudyByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("STUDY", id, page, limit);
};
