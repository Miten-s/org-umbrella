import * as childRepo from "../repo/test-group-item.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { TestGroup } from "../models/test-group.model";
import * as repo from "../repo/test-group.repo";
import { AppError } from "../types/common.types";

export const createTestGroup = async (data: any) => {
  return await sequelize.transaction(async (t) => {
    const parent = await repo.createTestGroupRepo(data, t);
    if (data.testGroupItems && Array.isArray(data.testGroupItems)) {
      for (const child of data.testGroupItems) {
        child.testGroupId = parent.id;
        await childRepo.createTestGroupItemRepo(child, t);
      }
    }
    return await repo.getTestGroupByIdRepo(parent.id, t);
  });
};

export const updateTestGroup = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getTestGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("TestGroup not found");
    error.statusCode = 404;
    throw error;
  }
  return await sequelize.transaction(async (t) => {
    await repo.updateTestGroupRepo(id, data, t);
    if (data.testGroupItems && Array.isArray(data.testGroupItems)) {
      const incomingIds = data.testGroupItems.map((c: any) => c.id || c._id).filter(Boolean);
      const existingChildren = (existing as any).testGroupItems || [];
      for (const ec of existingChildren) {
        if (!incomingIds.includes(ec.id)) {
          await childRepo.deleteTestGroupItemRepo(ec.id, userId, t);
        }
      }
      for (const child of data.testGroupItems) {
        const childId = child.id || child._id;
        if (childId) {
          await childRepo.updateTestGroupItemRepo(childId, child, t);
        } else {
          child.testGroupId = id;
          await childRepo.createTestGroupItemRepo(child, t);
        }
      }
    }
    return await repo.getTestGroupByIdRepo(id, t);
  });
};

export const getTestGroupById = async (id: string) => {
  const group = await repo.getTestGroupByIdRepo(id);
  if (!group) {
    const error: AppError = new Error("Test Group not found");
    error.statusCode = 404;
    throw error;
  }
  return group;
};

export const getAllTestGroups = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestGroupsRepo(skip, limit, filters);
  return { testGroups: rows, total: count };
};

export const deleteTestGroup = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestGroupRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: TestGroup, ids, entityName: "TEST_GROUP", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: TestGroup, ids, labelField: "name", entityName: "TEST_GROUP", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getTestGroupByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await TestGroup.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "TEST_GROUP", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getTestGroupByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("TEST_GROUP", id, page, limit);
};
