import { Request, Response } from "express";
import {
  createUserService,
  getAllUsersService,
  updateUserService,
  disableUserService,
  enableUserService,
  deleteUserService,
  bulkDeleteUsersService
} from "../services/gxp-service-users.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import { buildBulkCrudRoutes } from "../utils/bulk-crud-factory";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await createUserService(data);
  res.status(201).json(result);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const includeDisabled = req.query.includeDisabled === "true";
  const paginationOptions = getPaginationOptions(req.query);
  const result = await getAllUsersService(paginationOptions, includeDisabled);
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

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteUserService(id as string);
  res.status(200).send(result);
});

export const bulkDeleteUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }

    const result = await bulkDeleteUsersService(ids);
    res.status(200).send(result);
  }
);

// No nameField: a cloned Lab User's whole point is assigning the same roles
// to a DIFFERENT platform user, so there's no name to collision-suffix.
const bulkCrud = buildBulkCrudRoutes({
  createOne: (payload, currentUser) =>
    createUserService({ ...payload, createdBy: currentUser }),
  updateOne: (id, payload, currentUser) =>
    updateUserService(id, { ...payload, modifiedBy: currentUser }),
  restore: (id, currentUser) => enableUserService(id, currentUser)
});

export const bulkCopyUsers = bulkCrud.bulkCopy;
export const bulkUpdateUsers = bulkCrud.bulkUpdate;
export const bulkRestoreUsers = bulkCrud.bulkRestore!;
