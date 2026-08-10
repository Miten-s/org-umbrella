import * as childRepo from "../repo/calibration-schedule.repo";
import { sequelize } from "../configs/db.sequelize";
import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Calibration } from "../models/calibration.model";
import * as repo from "../repo/calibration.repo";
import { AppError } from "../types/common.types";

// Mock Kafka Publisher for Calibration Failure
const publishKafkaEvent = async (_topic: string, _message: any) => {
  // TODO: Implement actual Kafka producer here
};

export const createCalibration = async (data: any) => {
  const calibration = await repo.createCalibrationRepo(data);

  // If the result phrase implies failure, we publish a Kafka event
  // Assuming the frontend sends a specific phrase UUID for failure. We can check for a 'failed' boolean or known UUID if we had the phrase loaded.
  // For now, we simulate this logic:
  if (data.notes && data.notes.toLowerCase().includes("failed")) {
    await publishKafkaEvent("lims.calibration.failed", {
      calibrationId: calibration.id,
      instrumentId: calibration.instrumentId,
      performedAt: calibration.performedAt,
      timestamp: new Date().toISOString()
    });
  }

  return calibration;
};

export const updateCalibration = async (id: string, data: any, userId: string = "system") => {
  const existing = await repo.getCalibrationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Calibration not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await repo.updateCalibrationRepo(id, data);

  if (data.notes && data.notes.toLowerCase().includes("failed")) {
    await publishKafkaEvent("lims.calibration.failed", {
      calibrationId: updated?.id,
      instrumentId: updated?.instrumentId,
      performedAt: updated?.performedAt,
      timestamp: new Date().toISOString()
    });
  }

  return updated;
};

export const getCalibrationById = async (id: string) => {
  const calibration = await repo.getCalibrationByIdRepo(id);
  if (!calibration) {
    const error: AppError = new Error("Calibration not found");
    error.statusCode = 404;
    throw error;
  }
  return calibration;
};

export const getAllCalibrations = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllCalibrationsRepo(skip, limit, filters);
  return { calibrations: rows, total: count };
};

export const deleteCalibration = async (id: string, deletedBy: string) => {
  const existing = await repo.getCalibrationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Calibration not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteCalibrationRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Calibration, ids, entityName: "CALIBRATION", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Calibration, ids, labelField: "id", entityName: "CALIBRATION", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getCalibrationByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Calibration.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "CALIBRATION", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getCalibrationByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("CALIBRATION", id, page, limit);
};
