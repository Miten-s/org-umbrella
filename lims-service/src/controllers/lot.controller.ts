import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as lotService from "../services/lot.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createLot = asyncHandler(async (req: Request, res: Response) => {
  const lot = await lotService.createLot(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Lot"), data: lot });
});

export const updateLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const lot = await lotService.updateLot(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Lot"), data: lot });
});

export const getLotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const lot = await lotService.getLotById(id);
  res.status(200).json({ data: lot });
});

export const getAllLots = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await lotService.getAllLots(page, limit);
  res.status(200).json({
    data: result.lots,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await lotService.deleteLot(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Lot") });
});
