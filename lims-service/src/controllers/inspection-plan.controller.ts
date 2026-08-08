import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as inspectionPlanService from "../services/inspection-plan.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createInspectionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await inspectionPlanService.createInspectionPlan(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Inspection Plan"), data: plan });
});

export const updateInspectionPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const plan = await inspectionPlanService.updateInspectionPlan(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Inspection Plan"), data: plan });
});

export const getInspectionPlanById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const plan = await inspectionPlanService.getInspectionPlanById(id);
  res.status(200).json({ data: plan });
});

export const getAllInspectionPlans = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await inspectionPlanService.getAllInspectionPlans(page, limit);
  res.status(200).json({
    data: result.inspectionPlans,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteInspectionPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await inspectionPlanService.deleteInspectionPlan(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Inspection Plan") });
});
