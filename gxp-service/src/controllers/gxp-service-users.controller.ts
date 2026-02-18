import { Request, Response } from "express";
import {
  createUserService,
  getAllUsersService,
  updateUserService,
  disableUserService,
  enableUserService
} from "../services/gxp-service-users.service";
import asyncHandler from "../middlewares/error.middleware";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await createUserService(data);
  res.status(201).json(result);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await getAllUsersService();
  res.status(200).send(result);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await updateUserService(id as string, data);
  res.status(200).send(result);
});

export const disableUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await disableUserService(id);
  res.status(200).send(result);
});

export const enableUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = req.body?.comments ?? null;
  const result = await enableUserService(id, comments);
  res.status(200).send(result);
});
