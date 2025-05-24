import { Request, Response } from "express";
import permissionService from "../services/permission.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import asyncHandler from "../middlewares/error.middleware";

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
    const permissions = await permissionService.getPermissions();
    res.status(200).json({ permissions });
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
