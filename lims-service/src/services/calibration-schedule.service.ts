import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { CalibrationSchedule } from "../models/calibration-schedule.model";
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

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: CalibrationSchedule, ids, entityName: "CALIBRATION_SCHEDULE", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: CalibrationSchedule, ids, labelField: "id", entityName: "CALIBRATION_SCHEDULE", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getCalibrationScheduleByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await CalibrationSchedule.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "CALIBRATION_SCHEDULE", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getCalibrationScheduleByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("CALIBRATION_SCHEDULE", id, page, limit);
};
