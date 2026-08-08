import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as resultService from "../services/result.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createResult = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || "system";
  const result = await resultService.createResult(req.body, userId);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Result"), data: result });
});

export const updateResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const resultData = await resultService.updateResult(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Result"), data: resultData });
});

export const getResultById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const resultData = await resultService.getResultById(id);
  res.status(200).json({ data: resultData });
});

export const getAllResults = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const resultData = await resultService.getAllResults(page, limit);
  res.status(200).json({
    data: resultData.results,
    metadata: { totalCount: resultData.total, currentPage: page, limit, totalPages: Math.ceil(resultData.total / limit) }
  });
});

export const deleteResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await resultService.deleteResult(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Result") });
});
