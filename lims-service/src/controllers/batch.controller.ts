import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as batchService from "../services/batch.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.createBatch(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Batch"), data: batch });
});

export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const batch = await batchService.updateBatch(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Batch"), data: batch });
});

export const getBatchById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const batch = await batchService.getBatchById(id);
  res.status(200).json({ data: batch });
});

export const getAllBatches = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await batchService.getAllBatches(page, limit);
  res.status(200).json({
    data: result.batches,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await batchService.deleteBatch(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Batch") });
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await batchService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await batchService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await batchService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await batchService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});
