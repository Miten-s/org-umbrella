import { Request, Response, NextFunction } from "express";
import permissionService from "../services/permission.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";

export const createPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await permissionService.createPermission(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role")
    });
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await permissionService.updatePermission(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role")
    });
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await permissionService.getPermissions();
    res.status(200).json({ success: true, permissions });
  } catch (error) {
    next(error);
  }
};

export const deletePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await permissionService.deletePermission(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role")
    });
  } catch (error) {
    next(error);
  }
};
