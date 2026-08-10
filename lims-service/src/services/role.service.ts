import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Role } from "../models/role.model";
import * as repo from "../repo/role.repo";
import { AppError } from "../types/common.types";
import { sequelize } from "../configs/db.sequelize";

export const createRole = async (data: any) => {
  const { entries, ...roleData } = data;
  return await sequelize.transaction(async (t) => {
    return await repo.createRoleRepo(roleData, entries ?? [], t);
  });
};

export const updateRole = async (id: string, data: any) => {
  const existing = await repo.getRoleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }
  const { entries, ...roleData } = data;
  return await sequelize.transaction(async (t) => {
    return await repo.updateRoleRepo(id, roleData, entries, t);
  });
};

export const getRoleById = async (id: string) => {
  const role = await repo.getRoleByIdRepo(id);
  if (!role) {
    const error: AppError = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }
  return role;
};

export const getAllRoles = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllRolesRepo(skip, limit, filters);
  return { roles: rows, total: count };
};

export const deleteRole = async (id: string, deletedBy: string) => {
  const existing = await repo.getRoleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteRoleRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Role, ids, entityName: "ROLE", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Role, ids, labelField: "name", entityName: "ROLE", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getRoleByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Role.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "ROLE", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getRoleByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("ROLE", id, page, limit);
};
