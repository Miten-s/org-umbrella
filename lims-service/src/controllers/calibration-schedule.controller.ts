import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as calibrationScheduleService from "../services/calibration-schedule.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createCalibrationSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await calibrationScheduleService.createCalibrationSchedule(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Calibration Schedule"), data: schedule });
});

export const updateCalibrationSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const schedule = await calibrationScheduleService.updateCalibrationSchedule(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Calibration Schedule"), data: schedule });
});

export const getCalibrationScheduleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const schedule = await calibrationScheduleService.getCalibrationScheduleById(id);
  res.status(200).json({ data: schedule });
});

export const getAllCalibrationSchedules = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await calibrationScheduleService.getAllCalibrationSchedules(page, limit);
  res.status(200).json({
    data: result.calibrationSchedules,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteCalibrationSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await calibrationScheduleService.deleteCalibrationSchedule(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Calibration Schedule") });
});
