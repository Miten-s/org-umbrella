import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as stockParameterService from "../services/stock-parameter.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createStockParameter = asyncHandler(async (req: Request, res: Response) => {
  const param = await stockParameterService.createStockParameter(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Stock Parameter"), data: param });
});

export const updateStockParameter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const param = await stockParameterService.updateStockParameter(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Stock Parameter"), data: param });
});

export const getStockParameterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const param = await stockParameterService.getStockParameterById(id);
  res.status(200).json({ data: param });
});

export const getAllStockParameters = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await stockParameterService.getAllStockParameters(page, limit);
  res.status(200).json({
    data: result.stockParameters,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteStockParameter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await stockParameterService.deleteStockParameter(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Stock Parameter") });
});
