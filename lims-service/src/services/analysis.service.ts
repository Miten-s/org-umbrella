import * as childRepo from "../repo/analysis-component.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Analysis } from "../models/analysis.model";
import * as repo from "../repo/analysis.repo";
import { AppError } from "../types/common.types";

export const createAnalysis = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createAnalysisRepo(data, t);
    if (data.components && Array.isArray(data.components)) {
      for (const child of data.components) {
        child.analysisId = parent.id;
        await childRepo.createAnalysisComponentRepo(child, t);
      }
    }
    return await repo.getAnalysisByIdRepo(parent.id, t);
  });
};

export const updateAnalysis = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getAnalysisByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateAnalysisRepo(id, data, t);
    if (data.components && Array.isArray(data.components)) {
      const incomingIds = data.components.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).components || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteAnalysisComponentRepo(ec.id, userId, t);
        }
      }
      for (const child of data.components) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateAnalysisComponentRepo(childId, child, t);
        } else {
          child.analysisId = id;
          await childRepo.createAnalysisComponentRepo(child, t);
        }
      }
    }
    return await repo.getAnalysisByIdRepo(id, t);
  });
};

export const getAnalysisById = async (id: string) => {
  const analysis = await repo.getAnalysisByIdRepo(id);
  if (!analysis) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  return analysis;
};

export const getAllAnalyses = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllAnalysesRepo(skip, limit, filters);
  return { analyses: rows, total: count };
};

export const deleteAnalysis = async (id: string, deletedBy: string) => {
  const existing = await repo.getAnalysisByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Analysis not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteAnalysisRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Analysis, ids, entityName: "ANALYSIS", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Analysis, ids, labelField: "id", entityName: "ANALYSIS", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getAnalysisByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Analysis.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "ANALYSIS", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getAnalysisByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("ANALYSIS", id, page, limit);
};
