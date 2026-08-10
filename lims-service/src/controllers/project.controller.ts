import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
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

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await projectService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await projectService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await projectService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await projectService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});
