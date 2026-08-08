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

export const updateCalibration = async (id: string, data: any) => {
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
