import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as testWindowService from "../services/test-window.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createTestWindow = asyncHandler(async (req: Request, res: Response) => {
  const testWindow = await testWindowService.createTestWindow(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Test Window"), data: testWindow });
});

export const updateTestWindow = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testWindow = await testWindowService.updateTestWindow(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Test Window"), data: testWindow });
});

export const getTestWindowById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testWindow = await testWindowService.getTestWindowById(id);
  res.status(200).json({ data: testWindow });
});

export const getAllTestWindows = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await testWindowService.getAllTestWindows(page, limit);
  res.status(200).json({
    data: result.testWindows,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteTestWindow = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await testWindowService.deleteTestWindow(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Test Window") });
});
