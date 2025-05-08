import { NextFunction, Request, Response } from "express";
import userService from "../services/user.service";
import { RESPONSE_MESSAGES } from "../utils/constants";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.createUser(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "User"),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.updateUser(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "User"),
    });
  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.deleteUser(req);
    res.status(201).json({
      success: true,
      message: RESPONSE_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "User"),
    });
  } catch (error) {
    next(error);
  }
};