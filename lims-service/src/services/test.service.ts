import * as childRepo from "../repo/test-window.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Test } from "../models/test.model";
import * as repo from "../repo/test.repo";
import { AppError } from "../types/common.types";

export const createTest = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createTestRepo(data, t);
    if (data.testWindows && Array.isArray(data.testWindows)) {
      for (const child of data.testWindows) {
        child.testId = parent.id;
        await childRepo.createTestWindowRepo(child, t);
      }
    }
    return await repo.getTestByIdRepo(parent.id, t);
  });
};

export const updateTest = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getTestByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateTestRepo(id, data, t);
    if (data.testWindows && Array.isArray(data.testWindows)) {
      const incomingIds = data.testWindows.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).testWindows || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteTestWindowRepo(ec.id, userId, t);
        }
      }
      for (const child of data.testWindows) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateTestWindowRepo(childId, child, t);
        } else {
          child.testId = id;
          await childRepo.createTestWindowRepo(child, t);
        }
      }
    }
    return await repo.getTestByIdRepo(id, t);
  });
};

export const getTestById = async (id: string) => {
  const test = await repo.getTestByIdRepo(id);
  if (!test) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  return test;
};

export const getAllTests = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestsRepo(skip, limit, filters);
  return { tests: rows, total: count };
};

export const deleteTest = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Test, ids, entityName: "TEST", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Test, ids, labelField: "name", entityName: "TEST", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getTestByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Test.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "TEST", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getTestByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("TEST", id, page, limit);
};
