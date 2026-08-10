import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Project } from "../models/project.model";
import * as repo from "../repo/project.repo";
import { AppError } from "../types/common.types";

export const createProject = async (data: any) => {
  return await repo.createProjectRepo(data);
};

export const updateProject = async (id: string, data: any) => {
  const existing = await repo.getProjectByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateProjectRepo(id, data);
};

export const getProjectById = async (id: string) => {
  const project = await repo.getProjectByIdRepo(id);
  if (!project) {
    const error: AppError = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
  return project;
};

export const getAllProjects = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllProjectsRepo(skip, limit, filters);
  return { projects: rows, total: count };
};

export const deleteProject = async (id: string, deletedBy: string) => {
  const existing = await repo.getProjectByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteProjectRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Project, ids, entityName: "PROJECT", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Project, ids, labelField: "name", entityName: "PROJECT", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getProjectByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Project.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "PROJECT", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getProjectByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("PROJECT", id, page, limit);
};
