import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as studyService from "../services/study.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createStudy = asyncHandler(async (req: Request, res: Response) => {
  const study = await studyService.createStudy(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Study"), data: study });
});

export const updateStudy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const study = await studyService.updateStudy(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Study"), data: study });
});

export const getStudyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const study = await studyService.getStudyById(id);
  res.status(200).json({ data: study });
});

export const getAllStudies = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await studyService.getAllStudies(page, limit);
  res.status(200).json({
    data: result.studies,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteStudy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await studyService.deleteStudy(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Study") });
});
