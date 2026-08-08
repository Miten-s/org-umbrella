import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as stockBatchService from "../services/stock-batch.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createStockBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await stockBatchService.createStockBatch(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Stock Batch"), data: batch });
});

export const updateStockBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const batch = await stockBatchService.updateStockBatch(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Stock Batch"), data: batch });
});

export const getStockBatchById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const batch = await stockBatchService.getStockBatchById(id);
  res.status(200).json({ data: batch });
});

export const getAllStockBatches = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await stockBatchService.getAllStockBatches(page, limit);
  res.status(200).json({
    data: result.stockBatches,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteStockBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await stockBatchService.deleteStockBatch(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Stock Batch") });
});
