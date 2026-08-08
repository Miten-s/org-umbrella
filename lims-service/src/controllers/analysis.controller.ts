import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as analysisService from "../services/analysis.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const analysis = await analysisService.createAnalysis(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Analysis"), data: analysis });
});

export const updateAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const analysis = await analysisService.updateAnalysis(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Analysis"), data: analysis });
});

export const getAnalysisById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const analysis = await analysisService.getAnalysisById(id);
  res.status(200).json({ data: analysis });
});

export const getAllAnalyses = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await analysisService.getAllAnalyses(page, limit);
  res.status(200).json({
    data: result.analyses,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await analysisService.deleteAnalysis(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Analysis") });
});
