import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as testGroupItemService from "../services/test-group-item.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createTestGroupItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await testGroupItemService.createTestGroupItem(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Test Group Item"), data: item });
});

export const updateTestGroupItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const item = await testGroupItemService.updateTestGroupItem(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Test Group Item"), data: item });
});

export const getTestGroupItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const item = await testGroupItemService.getTestGroupItemById(id);
  res.status(200).json({ data: item });
});

export const getAllTestGroupItems = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await testGroupItemService.getAllTestGroupItems(page, limit);
  res.status(200).json({
    data: result.testGroupItems,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteTestGroupItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await testGroupItemService.deleteTestGroupItem(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Test Group Item") });
});
