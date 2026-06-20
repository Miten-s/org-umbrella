import { Request, Response } from "express";
import userService from "../services/user.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import asyncHandler from "../middlewares/error.middleware";
import { IUser } from "../models/user.model";
import { getPaginationOptions } from "../utils/pagination.util";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const paginationOptions = getPaginationOptions(req.query);
  const result = await userService.getUsers(paginationOptions, req?.user);
  res.status(200).json(result);
};

export const getUserDetail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as IUser)?.id;
    if (!userId) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    const user = await userService.getUserDetail(String(userId));
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

export const bulkDeleteUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "An array of ids is required" });
      return;
    }
    const result = await userService.bulkDeleteUsers(
      ids,
      (req.user as IUser)?.id?.toString()
    );
    res.status(200).json({ message: "Users deleted", result });
  }
);
