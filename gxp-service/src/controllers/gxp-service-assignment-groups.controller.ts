import { Request, Response } from "express";
import {
  addGroup,
  getAll,
  update,
  disable,
  enable,
  search,
  deleteGroup as deleteGroupService,
  bulkDeleteGroups,
  bulkDuplicateGroups
} from "../services/gxp-service-assignment-groups.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const result = await addGroup(req.body);
  res.status(201).json(result);
});


export const getAllGroups = asyncHandler(
  async (req: Request, res: Response) => {
    const paginationOptions = getPaginationOptions(req.query);
    const result = await getAll(paginationOptions);
    res.json(result);
  }
);

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await update(id, req.body);

  if (!result) {
    return res.status(404).json({
      message: "Assignment group not found"
    });
  }

  res.json(result);
});
export const disableGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.params;
    const result = await disable(groupName as string);
    res.json(result);
  }
);

export const enableGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.params;
    const result = await enable(groupName as string);
    res.json(result);
  }
);

export const restoreGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupName } = req.body;
    const result = await enable(groupName as string);
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

export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteGroupService(id as string);
  res.json(result);
});

export const bulkDeleteGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await bulkDeleteGroups(ids);
    res.status(200).send(result);
  }
);

export const bulkDuplicateGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await bulkDuplicateGroups(ids);
    res.status(201).send(result);
  }
);
