import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as aliquotService from "../services/aliquot.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createAliquot = asyncHandler(async (req: Request, res: Response) => {
  const aliquot = await aliquotService.createAliquot(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Aliquot"), data: aliquot });
});

export const updateAliquot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const aliquot = await aliquotService.updateAliquot(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Aliquot"), data: aliquot });
});

export const getAliquotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const aliquot = await aliquotService.getAliquotById(id);
  res.status(200).json({ data: aliquot });
});

export const getAllAliquots = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await aliquotService.getAllAliquots(page, limit);
  res.status(200).json({
    data: result.aliquots,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteAliquot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await aliquotService.deleteAliquot(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Aliquot") });
});
