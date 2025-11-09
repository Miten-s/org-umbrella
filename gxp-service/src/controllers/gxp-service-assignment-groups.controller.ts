import { Request, Response } from "express";
import {
  addGroup,
  getAll,
  update,
  disable,
  enable,
  search
} from "../services/gxp-service-assignment-groups.service";
import asyncHandler from "../middlewares/error.middleware";

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const result = await addGroup(req.body);
  res.status(201).json(result);
});

export const getAllGroups = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getAll();
    res.json(result);
  }
);

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupName } = req.params;
  const result = await update(groupName, req.body);
  res.json(result);
});

export const disableGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.params;
    const result = await disable(groupName);
    res.json(result);
  }
);

export const enableGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.params;
    const result = await enable(groupName);
    res.json(result);
  }
);

export const restoreGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.body;
    const result = await enable(groupName);
    res.json(result);
  }
);

export const searchGroups = asyncHandler(
  async (req: Request, res: Response) => {
    const { q } = req.query;
    const result = await search(q as string);
    res.json(result);
  }
);
