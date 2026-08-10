import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as lotService from "../services/lot.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createLot = asyncHandler(async (req: Request, res: Response) => {
  const lot = await lotService.createLot(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Lot"), data: lot });
});

export const updateLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const lot = await lotService.updateLot(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Lot"), data: lot });
});

export const getLotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const lot = await lotService.getLotById(id);
  res.status(200).json({ data: lot });
});

export const getAllLots = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await lotService.getAllLots(page, limit);
  res.status(200).json({
    data: result.lots,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await lotService.deleteLot(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Lot") });
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await lotService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await lotService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await lotService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await lotService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});
