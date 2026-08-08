import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as instrumentPartService from "../services/instrument-part.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createInstrumentPart = asyncHandler(async (req: Request, res: Response) => {
  const part = await instrumentPartService.createInstrumentPart(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Instrument Part"), data: part });
});

export const updateInstrumentPart = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const part = await instrumentPartService.updateInstrumentPart(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Instrument Part"), data: part });
});

export const getInstrumentPartById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const part = await instrumentPartService.getInstrumentPartById(id);
  res.status(200).json({ data: part });
});

export const getAllInstrumentParts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await instrumentPartService.getAllInstrumentParts(page, limit);
  res.status(200).json({
    data: result.instrumentParts,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteInstrumentPart = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await instrumentPartService.deleteInstrumentPart(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Instrument Part") });
});
