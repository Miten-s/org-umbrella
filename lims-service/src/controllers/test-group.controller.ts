import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as testGroupService from "../services/test-group.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createTestGroup = asyncHandler(async (req: Request, res: Response) => {
  const testGroup = await testGroupService.createTestGroup(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Test Group"), data: testGroup });
});

export const updateTestGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testGroup = await testGroupService.updateTestGroup(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Test Group"), data: testGroup });
});

export const getTestGroupById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testGroup = await testGroupService.getTestGroupById(id);
  res.status(200).json({ data: testGroup });
});

export const getAllTestGroups = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await testGroupService.getAllTestGroups(page, limit);
  res.status(200).json({
    data: result.testGroups,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteTestGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await testGroupService.deleteTestGroup(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Test Group") });
});
