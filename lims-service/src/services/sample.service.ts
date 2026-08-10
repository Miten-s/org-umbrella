import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Sample } from "../models/sample.model";
import * as repo from "../repo/sample.repo";
import * as testRepo from "../repo/test.repo";
import * as testWindowRepo from "../repo/test-window.repo";
import * as testGroupItemRepo from "../repo/test-group-item.repo";
import * as analysisComponentRepo from "../repo/analysis-component.repo";
import { AppError } from "../types/common.types";
import { sequelize } from "../configs/db.sequelize";

export const createSample = async (data: any) => {
  return await repo.createSampleRepo(data);
};

export const loginSample = async (data: any, userId: string) => {
  const t = await sequelize.transaction();
  try {
    // 1. Create the Sample
    const sampleData = {
      ...data,
      loggedInAt: new Date(),
      loggedInBy: userId,
      // Default to some 'Logged' phrase if we had it, omitting for simplicity unless provided
    };
    const sample = await repo.createSampleRepo(sampleData, t);

    // 2. If testGroupId is provided, auto-generate Tests and Test Windows
    if (data.testGroupId) {
      // Find all analyses for this test group
      const groupItemsResult = await testGroupItemRepo.getAllTestGroupItemsRepo(0, 1000, { testGroupId: data.testGroupId });
      const groupItems = groupItemsResult.rows;

      for (const item of groupItems) {
        // Create a Test for each Analysis
        const test = await testRepo.createTestRepo({
          sampleId: sample.id,
          analysisId: item.analysisId
        }, t);

        // Find all components for this analysis
        const componentsResult = await analysisComponentRepo.getAllAnalysisComponentsRepo(0, 1000, { analysisId: item.analysisId });
        const components = componentsResult.rows;

        for (const comp of components) {
          // Create a Test Window for each Component
          await testWindowRepo.createTestWindowRepo({
            testId: test.id,
            analysisComponentId: comp.id
          }, t);
        }
      }
    }

    await t.commit();
    return sample;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkLoginSamples = async (data: any, userId: string) => {
  // data.sampleNumbers is a space-separated or comma-separated string
  const numbers = data.sampleNumbers.split(/[\s,]+/).filter((n: string) => n.trim() !== "");

  const promises = numbers.map((num: string) => {
    const singleData = {
      ...data,
      sampleNumber: num
    };
    return loginSample(singleData, userId);
  });

  const createdSamples = await Promise.all(promises);
  return createdSamples;
};

export const updateSample = async (id: string, data: any) => {
  const existing = await repo.getSampleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Sample not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateSampleRepo(id, data);
};

export const getSampleById = async (id: string) => {
  const sample = await repo.getSampleByIdRepo(id);
  if (!sample) {
    const error: AppError = new Error("Sample not found");
    error.statusCode = 404;
    throw error;
  }
  return sample;
};

export const getAllSamples = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSamplesRepo(skip, limit, filters);
  return { samples: rows, total: count };
};

export const deleteSample = async (id: string, deletedBy: string) => {
  const existing = await repo.getSampleByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Sample not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSampleRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Sample, ids, entityName: "SAMPLE", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Sample, ids, labelField: "sampleId", entityName: "SAMPLE", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getSampleByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Sample.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "SAMPLE", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getSampleByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("SAMPLE", id, page, limit);
};
