import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as locationService from "../services/location.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await locationService.createLocation(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Location"), data: location });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const location = await locationService.updateLocation(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Location"), data: location });
});

export const getLocationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const location = await locationService.getLocationById(id);
  res.status(200).json({ data: location });
});

export const getAllLocations = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await locationService.getAllLocations(page, limit);
  res.status(200).json({
    data: result.locations,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await locationService.deleteLocation(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Location") });
});
