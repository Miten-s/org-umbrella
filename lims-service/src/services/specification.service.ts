import * as childRepo from "../repo/spec-limit.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Specification } from "../models/specification.model";
import * as repo from "../repo/specification.repo";
import { AppError } from "../types/common.types";

export const createSpecification = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createSpecificationRepo(data, t);
    if (data.specLimits && Array.isArray(data.specLimits)) {
      for (const child of data.specLimits) {
        child.specificationId = parent.id;
        await childRepo.createSpecLimitRepo(child, t);
      }
    }
    return await repo.getSpecificationByIdRepo(parent.id, t);
  });
};

export const updateSpecification = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getSpecificationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateSpecificationRepo(id, data, t);
    if (data.specLimits && Array.isArray(data.specLimits)) {
      const incomingIds = data.specLimits.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).specLimits || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteSpecLimitRepo(ec.id, userId, t);
        }
      }
      for (const child of data.specLimits) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateSpecLimitRepo(childId, child, t);
        } else {
          child.specificationId = id;
          await childRepo.createSpecLimitRepo(child, t);
        }
      }
    }
    return await repo.getSpecificationByIdRepo(id, t);
  });
};

export const getSpecificationById = async (id: string) => {
  const spec = await repo.getSpecificationByIdRepo(id);
  if (!spec) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  return spec;
};

export const getAllSpecifications = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSpecificationsRepo(skip, limit, filters);
  return { specifications: rows, total: count };
};

export const deleteSpecification = async (id: string, deletedBy: string) => {
  const existing = await repo.getSpecificationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Specification not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSpecificationRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Specification, ids, entityName: "SPECIFICATION", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Specification, ids, labelField: "id", entityName: "SPECIFICATION", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getSpecificationByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Specification.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "SPECIFICATION", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getSpecificationByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("SPECIFICATION", id, page, limit);
};
