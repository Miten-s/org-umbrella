import { Request, Response } from "express";
import {
  createRoleService,
  getAllRolesService,
  updateRoleService,
  disableRoleService,
  enableRoleService
} from "../services/gxp-service-roles.service";
import asyncHandler from "../middlewares/error.middleware";

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await createRoleService(data);
  res.status(201).json(result);
});

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const result = await getAllRolesService();
  res.json(result);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await updateRoleService(id, data);
  res.json(result);
});

export const disableRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await disableRoleService(id);
  res.json(result);
});

export const enableRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comments } = req.body;
  const result = await enableRoleService(id, comments);
  res.json(result);
});
