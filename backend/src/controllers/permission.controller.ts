import { Request, Response } from "express";
import permissionService from "../services/permission.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createPermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await permissionService.createPermission(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role")
    });
  }
);

export const updatePermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await permissionService.updatePermission(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role")
    });
  }
);


export const getPermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query;
    const paginationOptions = getPaginationOptions(req.query);
    const result = await permissionService.getPermissions(
      paginationOptions,
      type ? type?.toString() : 'default'
    );
    res.status(200).json(result);
  }
);

export const deletePermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await permissionService.deletePermission(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role")
    });
  }
);

export const bulkDeletePermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "An array of ids is required" });
      return;
    }
    const result = await permissionService.bulkDeletePermissions(ids);
    res.status(200).json({ message: "Permissions deleted", result });
  }
);
