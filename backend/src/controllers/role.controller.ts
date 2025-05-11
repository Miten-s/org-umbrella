import { Request, Response, NextFunction } from "express";
import userService from "../services/role.service";
import { RESPONSE_MESSAGES } from "../utils/constants";

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.createRole(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message ?? "Something went wrong",
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message ?? "Something went wrong",
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
      message: RESPONSE_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Role"),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message ?? "Something went wrong",
    });
  }
};

export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await userService.getRoles();
    res.status(200).json({ success: true, roles });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message ?? "Something went wrong",
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
      message: RESPONSE_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "Role"),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message ?? "Something went wrong",
    });
  }
};
