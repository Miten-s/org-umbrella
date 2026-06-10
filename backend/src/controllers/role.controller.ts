import { Request, Response } from "express";
import userService from "../services/role.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.createRole(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role")
    });
  }
);

// Define an asynchronous function called 'assignRole' that handles HTTP requests
export const assignRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await userService.assignRole(req);
    res.status(201).json({ user });
  }
);

export const updateRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.updateRole(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role")
    });
  }
);

export const getRoles = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query;
    const paginationOptions = getPaginationOptions(req.query);
    const result = await userService.getRoles(
      paginationOptions,
      req.user,
      type ? type.toString() : undefined
    );
    res.status(200).json(result);
  }
);

export const deleteRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.deleteRole(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role")
    });
  }
);

export const bulkDeleteRoles = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "An array of ids is required" });
      return;
    }
    const result = await userService.bulkDeleteRoles(ids);
    res.status(200).json({ message: "Roles deleted", result });
  }
);
