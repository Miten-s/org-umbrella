import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as calibrationService from "../services/calibration.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createCalibration = asyncHandler(async (req: Request, res: Response) => {
  const calibration = await calibrationService.createCalibration(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Calibration"), data: calibration });
});

export const updateCalibration = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const calibration = await calibrationService.updateCalibration(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Calibration"), data: calibration });
});

export const getCalibrationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const calibration = await calibrationService.getCalibrationById(id);
  res.status(200).json({ data: calibration });
});

export const getAllCalibrations = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await calibrationService.getAllCalibrations(page, limit);
  res.status(200).json({
    data: result.calibrations,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteCalibration = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await calibrationService.deleteCalibration(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Calibration") });
});
