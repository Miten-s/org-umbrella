import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as specificationService from "../services/specification.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createSpecification = asyncHandler(async (req: Request, res: Response) => {
  const spec = await specificationService.createSpecification(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Specification"), data: spec });
});

export const updateSpecification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const spec = await specificationService.updateSpecification(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Specification"), data: spec });
});

export const getSpecificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const spec = await specificationService.getSpecificationById(id);
  res.status(200).json({ data: spec });
});

export const getAllSpecifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await specificationService.getAllSpecifications(page, limit);
  res.status(200).json({
    data: result.specifications,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteSpecification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await specificationService.deleteSpecification(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Specification") });
});
