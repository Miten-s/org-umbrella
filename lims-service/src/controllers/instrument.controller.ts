import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as instrumentService from "../services/instrument.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createInstrument = asyncHandler(async (req: Request, res: Response) => {
  const instrument = await instrumentService.createInstrument(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Instrument"), data: instrument });
});

export const updateInstrument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const instrument = await instrumentService.updateInstrument(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Instrument"), data: instrument });
});

export const getInstrumentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const instrument = await instrumentService.getInstrumentById(id);
  res.status(200).json({ data: instrument });
});

export const getAllInstruments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await instrumentService.getAllInstruments(page, limit);
  res.status(200).json({
    data: result.instruments,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteInstrument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await instrumentService.deleteInstrument(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Instrument") });
});
