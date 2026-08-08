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
