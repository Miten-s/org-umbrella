import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as testService from "../services/test.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await testService.createTest(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Test"), data: test });
});

export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const test = await testService.updateTest(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Test"), data: test });
});

export const getTestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const test = await testService.getTestById(id);
  res.status(200).json({ data: test });
});

export const getAllTests = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await testService.getAllTests(page, limit);
  res.status(200).json({
    data: result.tests,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await testService.deleteTest(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Test") });
});
