import { Request, Response, NextFunction } from "express";
import permissionService from "../services/permission.service";
import { RESPONSE_MESSAGES } from "../utils/constants";

export const createPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await permissionService.createPermission(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error) {
    next(error);
  }
};

export const updaetePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await permissionService.updaetePermission(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
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
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error) {
    next(error);
  }
};
