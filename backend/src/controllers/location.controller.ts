import { Request, Response } from "express";
import * as locationService from "../services/location.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";

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
  async (_req: Request, res: Response): Promise<any> => {
    const locations = await locationService.getAllLocations();
    res.status(200).json({ locations });
  }
);

export const getLocationById = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.getLocationById(req.params.id);
    if (!location)
      return res.status(404).json({ error: "Location/Group not found" });
    res.status(200).json({ location });
  }
);

export const updateLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.updateLocation(
      req.params.id,
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
    const location = await locationService.deleteLocation(req.params.id);
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
