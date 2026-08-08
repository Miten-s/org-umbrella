import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as inspectionPersonnelService from "../services/inspection-personnel.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createInspectionPersonnel = asyncHandler(async (req: Request, res: Response) => {
  const personnel = await inspectionPersonnelService.createInspectionPersonnel(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Inspection Personnel"), data: personnel });
});

export const updateInspectionPersonnel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const personnel = await inspectionPersonnelService.updateInspectionPersonnel(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Inspection Personnel"), data: personnel });
});

export const getInspectionPersonnelById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const personnel = await inspectionPersonnelService.getInspectionPersonnelById(id);
  res.status(200).json({ data: personnel });
});

export const getAllInspectionPersonnel = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await inspectionPersonnelService.getAllInspectionPersonnel(page, limit);
  res.status(200).json({
    data: result.inspectionPersonnel,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteInspectionPersonnel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await inspectionPersonnelService.deleteInspectionPersonnel(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Inspection Personnel") });
});
