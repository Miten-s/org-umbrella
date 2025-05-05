import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";
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
  } catch (error) {
    next(error);
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
  } catch (error) {
    // If an error occurs, pass the error to the next middleware function for handling
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.updaeteRole(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error) {
    next(error);
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
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "Role"),
    });
  } catch (error) {
    next(error);
  }
};