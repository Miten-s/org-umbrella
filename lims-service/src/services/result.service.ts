import * as repo from "../repo/result.repo";
import * as testWindowRepo from "../repo/test-window.repo";
import * as specLimitRepo from "../repo/spec-limit.repo";
import { AppError } from "../types/common.types";

const publishKafkaEvent = async (_topic: string, _message: any) => {
  // TODO: Implement actual Kafka producer here
};

export const createResult = async (data: any, userId: string) => {
  const testWindow = await testWindowRepo.getTestWindowByIdRepo(data.testWindowId);
  if (!testWindow) {
    const error: AppError = new Error("Test Window not found");
    error.statusCode = 404;
    throw error;
  }

  // Determine if it is Out Of Spec (OOS)
  let isOos = false;
  // Get all spec limits for this analysis component
  const limitsResult = await specLimitRepo.getAllSpecLimitsRepo(0, 1000, { analysisComponentId: testWindow.analysisComponentId });
  const limits = limitsResult.rows;

  if (limits.length > 0) {
    for (const limit of limits) {
      if (data.numericValue !== undefined && data.numericValue !== null) {
        if (limit.minValue !== null && data.numericValue < limit.minValue) isOos = true;
        if (limit.maxValue !== null && data.numericValue > limit.maxValue) isOos = true;
      }
      if (data.textValue !== undefined && data.textValue !== null) {
        if (limit.targetText !== null && data.textValue !== limit.targetText) isOos = true;
      }
      if (data.booleanValue !== undefined && data.booleanValue !== null) {
        if (limit.targetBoolean !== null && data.booleanValue !== limit.targetBoolean) isOos = true;
      }
    }
  }

  const resultData = {
    ...data,
    isOos,
    enteredBy: userId,
    enteredAt: new Date()
  };

  const { sequelize } = await import("../configs/db.sequelize");
  const t = await sequelize.transaction();
  try {
    const result = await repo.createResultRepo(resultData, t);

    if (isOos) {
      await publishKafkaEvent("lims.result.oos", {
        resultId: result.id,
        testWindowId: testWindow.id,
        analysisComponentId: testWindow.analysisComponentId,
        timestamp: new Date().toISOString()
      });
    }

    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateResult = async (id: string, data: any) => {
  // Simplification: In a real LIMS, updating a result requires complex auditing and re-evaluation of OOS.
  const existing = await repo.getResultByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Result not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateResultRepo(id, data);
};

export const getResultById = async (id: string) => {
  const result = await repo.getResultByIdRepo(id);
  if (!result) {
    const error: AppError = new Error("Result not found");
    error.statusCode = 404;
    throw error;
  }
  return result;
};

export const getAllResults = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllResultsRepo(skip, limit, filters);
  return { results: rows, total: count };
};

export const deleteResult = async (id: string, deletedBy: string) => {
  const existing = await repo.getResultByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Result not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteResultRepo(id, deletedBy);
};
