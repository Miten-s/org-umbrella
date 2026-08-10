import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { TestGroupItem } from "../models/test-group-item.model";
import * as repo from "../repo/test-group-item.repo";
import { AppError } from "../types/common.types";

export const createTestGroupItem = async (data: any) => {
  return await repo.createTestGroupItemRepo(data);
};

export const updateTestGroupItem = async (id: string, data: any) => {
  const existing = await repo.getTestGroupItemByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateTestGroupItemRepo(id, data);
};

export const getTestGroupItemById = async (id: string) => {
  const item = await repo.getTestGroupItemByIdRepo(id);
  if (!item) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const getAllTestGroupItems = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllTestGroupItemsRepo(skip, limit, filters);
  return { testGroupItems: rows, total: count };
};

export const deleteTestGroupItem = async (id: string, deletedBy: string) => {
  const existing = await repo.getTestGroupItemByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Test Group Item not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteTestGroupItemRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: TestGroupItem, ids, entityName: "TEST_GROUP_ITEM", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: TestGroupItem, ids, labelField: "name", entityName: "TEST_GROUP_ITEM", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getTestGroupItemByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await TestGroupItem.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "TEST_GROUP_ITEM", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getTestGroupItemByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("TEST_GROUP_ITEM", id, page, limit);
};
