import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Location } from "../models/location.model";
import * as repo from "../repo/location.repo";
import { AppError } from "../types/common.types";

export const createLocation = async (data: any) => {
  return await repo.createLocationRepo(data);
};

export const updateLocation = async (id: string, data: any) => {
  const existing = await repo.getLocationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Location not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateLocationRepo(id, data);
};

export const getLocationById = async (id: string) => {
  const location = await repo.getLocationByIdRepo(id);
  if (!location) {
    const error: AppError = new Error("Location not found");
    error.statusCode = 404;
    throw error;
  }
  return location;
};

export const getAllLocations = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllLocationsRepo(skip, limit, filters);
  return { locations: rows, total: count };
};

export const deleteLocation = async (id: string, deletedBy: string) => {
  const existing = await repo.getLocationByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Location not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteLocationRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Location, ids, entityName: "LOCATION", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Location, ids, labelField: "name", entityName: "LOCATION", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getLocationByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Location.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "LOCATION", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getLocationByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("LOCATION", id, page, limit);
};
