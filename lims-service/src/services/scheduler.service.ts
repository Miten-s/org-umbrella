import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Scheduler } from "../models/scheduler.model";
import * as repo from "../repo/scheduler.repo";
import { AppError } from "../types/common.types";
import { logInfo, logError } from "../configs/logger.config";

export const createScheduler = async (data: any) => {
  return await repo.createSchedulerRepo(data);
};

export const updateScheduler = async (id: string, data: any) => {
  const existing = await repo.getSchedulerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Scheduler not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateSchedulerRepo(id, data);
};

export const getSchedulerById = async (id: string) => {
  const scheduler = await repo.getSchedulerByIdRepo(id);
  if (!scheduler) {
    const error: AppError = new Error("Scheduler not found");
    error.statusCode = 404;
    throw error;
  }
  return scheduler;
};

export const getAllSchedulers = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllSchedulersRepo(skip, limit, filters);
  return { schedulers: rows, total: count };
};

export const deleteScheduler = async (id: string, deletedBy: string) => {
  const existing = await repo.getSchedulerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Scheduler not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteSchedulerRepo(id, deletedBy);
};

/**
 * Cron tick — fires for all active schedulers whose nextRunDate is in the past.
 * Currently increments generatedCount and advances nextRunDate by 1 day.
 * TODO: create the target Sample/Test/Result record based on `scope`.
 */
export const processSchedulerTick = async () => {
  try {
    const due = await repo.getActiveSchedulersDueRepo();
    for (const scheduler of due) {
      const next = new Date(scheduler.nextRunDate ?? new Date());
      next.setDate(next.getDate() + 1);
      await repo.updateSchedulerRepo(scheduler.id!, {
        lastRunDate: new Date(),
        nextRunDate: next,
        generatedCount: (scheduler.generatedCount ?? 0) + 1
      });
      logInfo(`Scheduler tick processed: ${scheduler.schedulerId}`, {}, "processSchedulerTick", "scheduler.service.ts");
    }
  } catch (err) {
    logError("Scheduler tick failed", { err }, "processSchedulerTick", "scheduler.service.ts");
  }
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Scheduler, ids, entityName: "SCHEDULER", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Scheduler, ids, labelField: "id", entityName: "SCHEDULER", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getSchedulerByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Scheduler.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "SCHEDULER", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getSchedulerByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("SCHEDULER", id, page, limit);
};
