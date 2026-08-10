import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Group } from "../models/group.model";
import * as repo from "../repo/group.repo";
import { AppError } from "../types/common.types";

export const createGroup = async (data: any) => {
  return await repo.createGroupRepo(data);
};

export const updateGroup = async (id: string, data: any) => {
  const existing = await repo.getGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateGroupRepo(id, data);
};

export const getGroupById = async (id: string) => {
  const group = await repo.getGroupByIdRepo(id);
  if (!group) {
    const error: AppError = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }
  return group;
};

export const getAllGroups = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllGroupsRepo(skip, limit, filters);
  return { groups: rows, total: count };
};

export const deleteGroup = async (id: string, deletedBy: string) => {
  const existing = await repo.getGroupByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteGroupRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Group, ids, entityName: "GROUP", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Group, ids, labelField: "name", entityName: "GROUP", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getGroupByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Group.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "GROUP", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getGroupByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("GROUP", id, page, limit);
};
