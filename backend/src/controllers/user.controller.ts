import { NextFunction, Request, Response } from "express";
import userService from "../services/user.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { IUser } from "../models/user.model";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getUsers(req?.user);
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const getUserDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: userId } = req.user as IUser;
    const user = await userService.getUserDetail(userId);
    res.status(200).json({ success: true, user });
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
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "User"),
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
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "User"),
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
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "User"),
    });
  } catch (error) {
    next(error);
  }
};
