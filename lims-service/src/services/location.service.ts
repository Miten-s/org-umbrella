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
