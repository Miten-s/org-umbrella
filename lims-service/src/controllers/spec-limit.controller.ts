import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as specLimitService from "../services/spec-limit.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createSpecLimit = asyncHandler(async (req: Request, res: Response) => {
  const limit = await specLimitService.createSpecLimit(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Spec Limit"), data: limit });
});

export const updateSpecLimit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const limit = await specLimitService.updateSpecLimit(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Spec Limit"), data: limit });
});

export const getSpecLimitById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const limit = await specLimitService.getSpecLimitById(id);
  res.status(200).json({ data: limit });
});

export const getAllSpecLimits = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await specLimitService.getAllSpecLimits(page, limit);
  res.status(200).json({
    data: result.specLimits,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteSpecLimit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await specLimitService.deleteSpecLimit(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Spec Limit") });
});
