import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as sampleService from "../services/sample.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createSample = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.createSample(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Sample"), data: sample });
});

export const loginSample = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || "system";
  const sample = await sampleService.loginSample(req.body, userId);
  res.status(201).json({ message: "Sample logged in successfully", data: sample });
});

export const bulkLoginSamples = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || "system";
  const samples = await sampleService.bulkLoginSamples(req.body, userId);
  res.status(201).json({ message: "Bulk Samples logged in successfully", data: samples });
});

export const updateSample = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const sample = await sampleService.updateSample(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Sample"), data: sample });
});

export const getSampleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const sample = await sampleService.getSampleById(id);
  res.status(200).json({ data: sample });
});

export const getAllSamples = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await sampleService.getAllSamples(page, limit);
  res.status(200).json({
    data: result.samples,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteSample = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await sampleService.deleteSample(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Sample") });
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await sampleService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await sampleService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await sampleService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await sampleService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});
