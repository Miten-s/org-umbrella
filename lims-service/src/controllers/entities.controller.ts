import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as groupService from "../services/group.service";
import * as roleService from "../services/role.service";
import * as limsUserService from "../services/lims-user.service";
import * as schedulerService from "../services/scheduler.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

// ─── Groups ──────────────────────────────────────────────────────────────────

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.createGroup(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Group"), data: group });
});

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const group = await groupService.updateGroup(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Group"), data: group });
});

export const getGroupById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const group = await groupService.getGroupById(id);
  res.status(200).json({ data: group });
});

export const getAllGroups = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await groupService.getAllGroups(page, limit);
  res.status(200).json({
    data: result.groups,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await groupService.deleteGroup(id, req.user?.id || "system");
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Group") });
});

// ─── Roles ───────────────────────────────────────────────────────────────────

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Role"), data: role });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const role = await roleService.updateRole(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Role"), data: role });
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const role = await roleService.getRoleById(id);
  res.status(200).json({ data: role });
});

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await roleService.getAllRoles(page, limit);
  res.status(200).json({
    data: result.roles,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await roleService.deleteRole(id, req.user?.id || "system");
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Role") });
});

// ─── LIMS Users ───────────────────────────────────────────────────────────────

export const createLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await limsUserService.createLimsUser(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "LIMS User"), data: user });
});

export const updateLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await limsUserService.updateLimsUser(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "LIMS User"), data: user });
});

export const getLimsUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await limsUserService.getLimsUserById(id);
  res.status(200).json({ data: user });
});

export const getAllLimsUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await limsUserService.getAllLimsUsers(page, limit);
  res.status(200).json({
    data: result.users,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await limsUserService.deleteLimsUser(id, req.user?.id || "system");
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "LIMS User") });
});

// ─── Schedulers ───────────────────────────────────────────────────────────────

export const createScheduler = asyncHandler(async (req: Request, res: Response) => {
  const scheduler = await schedulerService.createScheduler(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Scheduler"), data: scheduler });
});

export const updateScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const scheduler = await schedulerService.updateScheduler(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Scheduler"), data: scheduler });
});

export const getSchedulerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const scheduler = await schedulerService.getSchedulerById(id);
  res.status(200).json({ data: scheduler });
});

export const getAllSchedulers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await schedulerService.getAllSchedulers(page, limit);
  res.status(200).json({
    data: result.schedulers,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await schedulerService.deleteScheduler(id, req.user?.id || "system");
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Scheduler") });
});

export const bulkDeleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await groupService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await groupService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restoreGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await groupService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogsGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await groupService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});

export const bulkDeleteLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await limsUserService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicateLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await limsUserService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restoreLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await limsUserService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogsLimsUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await limsUserService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});

export const bulkDeleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await roleService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicateRole = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await roleService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restoreRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await roleService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogsRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await roleService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});

export const bulkDeleteScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { ids, changeReason } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await schedulerService.bulkDelete(ids, changeReason, userId, userName);
  res.status(200).json({ message: `${count} record(s) removed`, count });
});

export const bulkDuplicateScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const count = await schedulerService.bulkDuplicate(ids, userId, userName);
  res.status(200).json({ message: `${count} record(s) duplicated`, count });
});

export const restoreScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { changeReason } = req.body as RestoreOperationDto;
  const userId = String(req.user?.id || "system");
  const userName = String(req.user?.fullName || "system");
  const restored = await schedulerService.restore(id, changeReason, userId, userName);
  res.status(200).json({ message: "Record restored", data: restored });
});

export const getAuditLogsScheduler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const page = Number(req.query["page"] || 1);
  const limit = Number(req.query["limit"] || 20);
  const result = await schedulerService.getAuditLogs(id, page, limit);
  res.status(200).json({ audit: result.logs, total: result.total });
});
