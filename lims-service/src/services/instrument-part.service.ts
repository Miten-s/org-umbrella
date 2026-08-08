import * as repo from "../repo/instrument-part.repo";
import { AppError } from "../types/common.types";

export const createInstrumentPart = async (data: any) => {
  return await repo.createInstrumentPartRepo(data);
};

export const updateInstrumentPart = async (id: string, data: any) => {
  const existing = await repo.getInstrumentPartByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInstrumentPartRepo(id, data);
};

export const getInstrumentPartById = async (id: string) => {
  const part = await repo.getInstrumentPartByIdRepo(id);
  if (!part) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  return part;
};

export const getAllInstrumentParts = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInstrumentPartsRepo(skip, limit, filters);
  return { instrumentParts: rows, total: count };
};

export const deleteInstrumentPart = async (id: string, deletedBy: string) => {
  const existing = await repo.getInstrumentPartByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument Part not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInstrumentPartRepo(id, deletedBy);
};
