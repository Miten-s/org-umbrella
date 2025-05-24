import { Request, Response } from "express";
import userService from "../services/user.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { IUser } from "../models/user.model";
import asyncHandler from "../middlewares/error.middleware";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const users = await userService.getUsers(req?.user);
  res.status(200).json({ users });
};

export const getUserDetail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.user as IUser;
    console.log('userId', userId);
    const user = await userService.getUserDetail(userId);
    console.log('user', user);
    res.status(200).json({ user });
  }
);

export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.createUser(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace("{{ entity }}", "User")
    });
  }
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.updateUser(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "User")
    });
  }
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await userService.deleteUser(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace("{{ entity }}", "User")
    });
  }
);
