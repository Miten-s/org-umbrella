import { Request, Response } from "express";
import userService from "../services/role.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import asyncHandler from "../middlewares/error.middleware";

export const createRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.createRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role")
    });
  }
);

// Define an asynchronous function called 'assignRole' that handles HTTP requests
export const assignRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await userService.assignRole(req);
    res.status(201).json({ success: true, user });
  }
);

export const updateRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.updateRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role")
    });
  }
);

export const getRoles = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const roles = await userService.getRoles(req.user);
    res.status(200).json({ success: true, roles });
  }
);

export const deleteRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.deleteRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role")
    });
  }
);
