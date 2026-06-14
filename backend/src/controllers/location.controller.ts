import { Request, Response } from "express";
import * as locationService from "../services/location.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { getPaginationOptions } from "../utils/pagination.util";

export const createLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    await locationService.createLocation(req.body);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace(
        "{{ entity }}",
        "Location/Group"
      )
    });
  }
);

export const getAllLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = getPaginationOptions(req.query);
    const result = await locationService.getAllLocations(paginationOptions);
    res.status(200).json(result);
  }
);

export const getLocationById = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.getLocationById(
      req.params.id as string
    );
    if (!location)
      return res.status(404).json({ error: "Location/Group not found" });
    res.status(200).json({ location });
  }
);

export const updateLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.updateLocation(
      req.params.id as string,
      req.body
    );
    if (!location)
      return res.status(404).json({ error: "Location/Group not found" });
    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace(
        "{{ entity }}",
        "Location/Group"
      )
    });
  }
);

export const deleteLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.deleteLocation(
      req.params.id as string
    );
    if (!location)
      return res.status(404).json({ error: "Location/Group not found" });
    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace(
        "{{ entity }}",
        "Location/Group"
      )
    });
  }
);

export const bulkDeleteLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await locationService.bulkDeleteLocations(ids);
    res.status(200).json({ message: "Locations deleted", result });
  }
);

export const bulkDuplicateLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await locationService.bulkDuplicateLocations(ids, req.user);
    res.status(201).json({ message: "Locations duplicated", result });
  }
);
