import { Request, Response } from "express";
import * as locationService from "../services/location.service";
import asyncHandler from "../middlewares/error.middleware";

export const createLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.createLocation(req.body);
    res.status(201).json(location);
  }
);

export const getAllLocations = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const locations = await locationService.getAllLocations();
    res.status(200).json(locations);
  }
);

export const getLocationByName = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.getLocationByName(req.params.name);
    if (!location)
      return res.status(404).json({ message: "Location/Group not found" });
    res.status(200).json(location);
  }
);

export const updateLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.updateLocation(
      req.params.name,
      req.body
    );
    if (!location)
      return res.status(404).json({ message: "Location/Group not found" });
    res.status(200).json(location);
  }
);

export const disableLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.disableLocation({
      name: req.params.name,
      comments: req.body.comments
    });
    if (!location)
      return res.status(404).json({ message: "Location/Group not found" });
    res.status(200).json(location);
  }
);

export const enableLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const location = await locationService.enableLocation(req.params.name);
    if (!location)
      return res.status(404).json({ message: "Location/Group not found" });
    res.status(200).json(location);
  }
);
