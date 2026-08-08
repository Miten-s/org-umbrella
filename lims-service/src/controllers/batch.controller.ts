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
