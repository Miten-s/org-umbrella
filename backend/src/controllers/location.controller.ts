import { Request, Response } from "express";
import * as locationService from "../services/location.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { getPaginationOptions } from "../utils/pagination.util";
import { cacheResponse, getCachedResponse, deleteCacheByPrefix } from "../configs/redis.config";

export const createLocation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    await locationService.createLocation(req.body);
    await deleteCacheByPrefix("locations:all:");
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
    const cacheKey = `locations:all:${JSON.stringify(paginationOptions)}`;

    const cachedData = await getCachedResponse(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const result = await locationService.getAllLocations(paginationOptions);
    await cacheResponse({ key: cacheKey, value: result, ttl: 3600 });
    
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
      
    await deleteCacheByPrefix("locations:all:");
    
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
      
    await deleteCacheByPrefix("locations:all:");
    
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
    await deleteCacheByPrefix("locations:all:");
    res.status(200).json({ message: "Locations deleted", result });
  }
);

export const bulkDuplicateLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await locationService.bulkDuplicateLocations(ids, req.user);
    await deleteCacheByPrefix("locations:all:");
    res.status(201).json({ message: "Locations duplicated", result });
  }
);

export const bulkCopyLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { records } = req.body;
    const results = await locationService.bulkCopyLocations(records, req.user);
    await deleteCacheByPrefix("locations:all:");
    res.status(201).json({
      message: `${results.length} record(s) copied`,
      count: results.length,
      results
    });
  }
);

export const bulkUpdateLocations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { updates } = req.body;
    const results = await locationService.bulkUpdateLocations(
      updates,
      req.user
    );
    await deleteCacheByPrefix("locations:all:");
    res.status(200).json({
      message: `${results.length} record(s) updated`,
      count: results.length,
      results
    });
  }
);
