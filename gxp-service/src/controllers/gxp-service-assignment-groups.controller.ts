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
import { findGroupById } from "../repo/gxp-service-assignment-groups.repo";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import { buildBulkCrudRoutes } from "../utils/bulk-crud-factory";
import AssignmentGroup from "../models/gxp-service-assignment-groups.model";
import { CreateAssignmentGroupDto } from "../dtos/assignment-group.dto";

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const result = await addGroup(req.body);
  res.status(201).json(result);
});

export const getAllGroups = asyncHandler(
  async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === "true";
    const paginationOptions = getPaginationOptions(req.query);
    const result = await getAll(paginationOptions, includeInactive);
    res.json(result);
  }
);

export const getGroupById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await findGroupById(id as string);
    if (!result)
      return res.status(404).json({ message: "Assignment group not found" });
    res.json(result);
  }
);

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await update(id as string, req.body);

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

export const enableGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupName } = req.params;
  const result = await enable(groupName as string);
  res.json(result);
});

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

// enable/disable route by :groupName, not :id — restore resolves the PK to a
// groupName first, since bulk-restore (like every other bulk op) selects by id.
const restoreGroupById = async (id: string) => {
  const group = await findGroupById(id);
  if (!group) return null;
  return await enable(group.groupName);
};

const bulkCrud = buildBulkCrudRoutes({
  model: AssignmentGroup,
  nameField: "groupName",
  createDtoClass: CreateAssignmentGroupDto,
  createOne: (payload) => addGroup(payload),
  updateOne: (id, payload) => update(id, payload),
  restore: restoreGroupById
});

export const bulkCopyGroups = bulkCrud.bulkCopy;
export const bulkUpdateGroups = bulkCrud.bulkUpdate;
export const bulkRestoreGroups = bulkCrud.bulkRestore!;
