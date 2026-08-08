import * as repo from "../repo/instrument.repo";
import { AppError } from "../types/common.types";

export const createInstrument = async (data: any) => {
  return await repo.createInstrumentRepo(data);
};

export const updateInstrument = async (id: string, data: any) => {
  const existing = await repo.getInstrumentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateInstrumentRepo(id, data);
};

export const getInstrumentById = async (id: string) => {
  const instrument = await repo.getInstrumentByIdRepo(id);
  if (!instrument) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  return instrument;
};

export const getAllInstruments = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllInstrumentsRepo(skip, limit, filters);
  return { instruments: rows, total: count };
};

export const deleteInstrument = async (id: string, deletedBy: string) => {
  const existing = await repo.getInstrumentByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteInstrumentRepo(id, deletedBy);
};
