import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as stockService from "../services/stock.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createStock = asyncHandler(async (req: Request, res: Response) => {
  const stock = await stockService.createStock(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Stock"), data: stock });
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const stock = await stockService.updateStock(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Stock"), data: stock });
});

export const getStockById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const stock = await stockService.getStockById(id);
  res.status(200).json({ data: stock });
});

export const getAllStock = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await stockService.getAllStock(page, limit);
  res.status(200).json({
    data: result.stock,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await stockService.deleteStock(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Stock") });
});
