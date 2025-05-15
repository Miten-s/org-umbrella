import { Request, Response, NextFunction } from "express";
import userService from "../services/role.service";
import { CUSTOM_MESSAGES, isAppError } from "../utils/common.util";

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.createRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        (isAppError(error) ? error?.message : error) ?? "Something went wrong",
    });
  }
};

// Define an asynchronous function called 'assignRole' that handles HTTP requests
export const assignRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.assignRole(req);
    res.status(201).json({ success: true, user });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        (isAppError(error) ? error?.message : error) ?? "Something went wrong",
    });
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.updateRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role"),
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        (isAppError(error) ? error?.message : error) ?? "Something went wrong",
    });
  }
};

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await userService.getRoles(req.user);
    res.status(200).json({ success: true, roles });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        (isAppError(error) ? error?.message : error) ?? "Something went wrong",
    });
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.deleteRole(req);
    res.status(201).json({
      success: true,
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role"),
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        (isAppError(error) ? error?.message : error) ?? "Something went wrong",
    });
  }
};
