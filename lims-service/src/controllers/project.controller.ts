import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as projectService from "../services/project.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Project"), data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const project = await projectService.updateProject(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Project"), data: project });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const project = await projectService.getProjectById(id);
  res.status(200).json({ data: project });
});

export const getAllProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await projectService.getAllProjects(page, limit);
  res.status(200).json({
    data: result.projects,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await projectService.deleteProject(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Project") });
});
