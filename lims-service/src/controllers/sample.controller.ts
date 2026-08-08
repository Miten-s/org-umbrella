import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as sampleService from "../services/sample.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createSample = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.createSample(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Sample"), data: sample });
});

export const loginSample = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || "system";
  const sample = await sampleService.loginSample(req.body, userId);
  res.status(201).json({ message: "Sample logged in successfully", data: sample });
});

export const bulkLoginSamples = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || "system";
  const samples = await sampleService.bulkLoginSamples(req.body, userId);
  res.status(201).json({ message: "Bulk Samples logged in successfully", data: samples });
});

export const updateSample = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const sample = await sampleService.updateSample(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Sample"), data: sample });
});

export const getSampleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const sample = await sampleService.getSampleById(id);
  res.status(200).json({ data: sample });
});

export const getAllSamples = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await sampleService.getAllSamples(page, limit);
  res.status(200).json({
    data: result.samples,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteSample = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await sampleService.deleteSample(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Sample") });
});
