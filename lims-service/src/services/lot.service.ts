import * as repo from "../repo/lot.repo";
import { AppError } from "../types/common.types";

export const createLot = async (data: any) => {
  return await repo.createLotRepo(data);
};

export const updateLot = async (id: string, data: any) => {
  const existing = await repo.getLotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateLotRepo(id, data);
};

export const getLotById = async (id: string) => {
  const lot = await repo.getLotByIdRepo(id);
  if (!lot) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  return lot;
};

export const getAllLots = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllLotsRepo(skip, limit, filters);
  return { lots: rows, total: count };
};

export const deleteLot = async (id: string, deletedBy: string) => {
  const existing = await repo.getLotByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Lot not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteLotRepo(id, deletedBy);
};
