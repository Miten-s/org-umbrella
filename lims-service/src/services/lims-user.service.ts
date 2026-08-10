import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { LimsUser } from "../models/lims-user.model";
import * as repo from "../repo/lims-user.repo";
import { AppError } from "../types/common.types";
import { sequelize } from "../configs/db.sequelize";

export const createLimsUser = async (data: any) => {
  const { user, roles, accessGroups, group, location, ...rest } = data;
  const payload = {
    ...rest,
    userId: user.id,
    userName: user.name,
    groupId: group ?? null,
    locationId: location ?? null
  };
  return await sequelize.transaction(async (t) => {
    return await repo.createLimsUserRepo(payload, roles ?? [], accessGroups ?? [], t);
  });
};

export const updateLimsUser = async (id: string, data: any) => {
  const existing = await repo.getLimsUserByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("LIMS user not found");
    error.statusCode = 404;
    throw error;
  }
  const { roles, accessGroups, group, location, ...rest } = data;
  const payload: any = { ...rest };
  if (group !== undefined) payload.groupId = group;
  if (location !== undefined) payload.locationId = location;

  return await sequelize.transaction(async (t) => {
    return await repo.updateLimsUserRepo(id, payload, roles, accessGroups, t);
  });
};

export const getLimsUserById = async (id: string) => {
  const user = await repo.getLimsUserByIdRepo(id);
  if (!user) {
    const error: AppError = new Error("LIMS user not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const getAllLimsUsers = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllLimsUsersRepo(skip, limit, filters);
  return { users: rows, total: count };
};

export const deleteLimsUser = async (id: string, deletedBy: string) => {
  const existing = await repo.getLimsUserByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("LIMS user not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteLimsUserRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: LimsUser, ids, entityName: "USER", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: LimsUser, ids, labelField: "userName", entityName: "USER", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getLimsUserByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await LimsUser.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "USER", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getLimsUserByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("USER", id, page, limit);
};
