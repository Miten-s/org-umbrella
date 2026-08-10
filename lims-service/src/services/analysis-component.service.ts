import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { AnalysisComponent } from "../models/analysis-component.model";
import * as repo from "../repo/analysis-component.repo";
import { AppError } from "../types/common.types";

export const createAnalysisComponent = async (data: any) => {
  return await repo.createAnalysisComponentRepo(data);
};

export const updateAnalysisComponent = async (id: string, data: any) => {
  const existing = await repo.getAnalysisComponentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateAnalysisComponentRepo(id, data);
};

export const getAnalysisComponentById = async (id: string) => {
  const component = await repo.getAnalysisComponentByIdRepo(id);
  if (!component) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  return component;
};

export const getAllAnalysisComponents = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllAnalysisComponentsRepo(skip, limit, filters);
  return { analysisComponents: rows, total: count };
};

export const deleteAnalysisComponent = async (id: string, deletedBy: string) => {
  const existing = await repo.getAnalysisComponentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis Component not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteAnalysisComponentRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: AnalysisComponent, ids, entityName: "ANALYSIS_COMPONENT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: AnalysisComponent, ids, labelField: "id", entityName: "ANALYSIS_COMPONENT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getAnalysisComponentByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await AnalysisComponent.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "ANALYSIS_COMPONENT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getAnalysisComponentByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("ANALYSIS_COMPONENT", id, page, limit);
};
