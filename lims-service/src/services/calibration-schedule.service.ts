import * as repo from "../repo/calibration-schedule.repo";
import { AppError } from "../types/common.types";

export const createCalibrationSchedule = async (data: any) => {
  return await repo.createCalibrationScheduleRepo(data);
};

export const updateCalibrationSchedule = async (id: string, data: any) => {
  const existing = await repo.getCalibrationScheduleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Calibration Schedule not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateCalibrationScheduleRepo(id, data);
};

export const getCalibrationScheduleById = async (id: string) => {
  const schedule = await repo.getCalibrationScheduleByIdRepo(id);
  if (!schedule) {
    const error: AppError = new Error("Calibration Schedule not found");
    error.statusCode = 404;
    throw error;
  }
  return schedule;
};

export const getAllCalibrationSchedules = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllCalibrationSchedulesRepo(skip, limit, filters);
  return { calibrationSchedules: rows, total: count };
};

export const deleteCalibrationSchedule = async (id: string, deletedBy: string) => {
  const existing = await repo.getCalibrationScheduleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Calibration Schedule not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteCalibrationScheduleRepo(id, deletedBy);
};
