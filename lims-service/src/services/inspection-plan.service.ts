import * as childRepo from "../repo/inspection-personnel.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { InspectionPlan } from "../models/inspection-plan.model";
import * as repo from "../repo/inspection-plan.repo";
import { AppError } from "../types/common.types";

export const createInspectionPlan = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createInspectionPlanRepo(data, t);
    if (data.inspectionPersonnel && Array.isArray(data.inspectionPersonnel)) {
      for (const child of data.inspectionPersonnel) {
        child.inspectionPlanId = parent.id;
        await childRepo.createInspectionPersonnelRepo(child, t);
      }
    }
    return await repo.getInspectionPlanByIdRepo(parent.id, t);
  });
};

export const updateInspectionPlan = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getInspectionPlanByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("InspectionPlan not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateInspectionPlanRepo(id, data, t);
    if (data.inspectionPersonnel && Array.isArray(data.inspectionPersonnel)) {
      const incomingIds = data.inspectionPersonnel.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).inspectionPersonnel || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteInspectionPersonnelRepo(ec.id, userId, t);
        }
      }
      for (const child of data.inspectionPersonnel) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateInspectionPersonnelRepo(childId, child, t);
        } else {
          child.inspectionPlanId = id;
          await childRepo.createInspectionPersonnelRepo(child, t);
        }
      }
    }
    return await repo.getInspectionPlanByIdRepo(id, t);
  });
};

export const getInspectionPlanById = async (id: string) => {
  const plan = await repo.getInspectionPlanByIdRepo(id);
  if (!plan) {
    const error: AppError = new Error("Inspection Plan not found");
    error.statusCode = 404;
    throw error;
  }
  return plan;
};

export const getAllInspectionPlans = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInspectionPlansRepo(skip, limit, filters);
  return { inspectionPlans: rows, total: count };
};

export const deleteInspectionPlan = async (id: string, deletedBy: string) => {
  const existing = await repo.getInspectionPlanByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Inspection Plan not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInspectionPlanRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: InspectionPlan, ids, entityName: "INSPECTION_PLAN", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: InspectionPlan, ids, labelField: "id", entityName: "INSPECTION_PLAN", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getInspectionPlanByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await InspectionPlan.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "INSPECTION_PLAN", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getInspectionPlanByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("INSPECTION_PLAN", id, page, limit);
};
