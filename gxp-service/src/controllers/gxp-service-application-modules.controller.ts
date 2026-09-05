import { Request, Response } from "express";
import * as service from "../services/gxp-service-applications-modules.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import { buildBulkCrudRoutes } from "../utils/bulk-crud-factory";
import AppModule from "../models/gxp-service-application-modules.model";
import { CreateAppModuleDto } from "../dtos/master-data.dto";

export const createApplicationModule = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = (req as any).user?.id ?? null;
    const payload = req.body;
    const created = await service.createApplicationModule(
      payload,
      currentUser ?? undefined
    );
    return res.status(201).json(created);
  }
);

export const getApplicationModules = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const paginationOptions = getPaginationOptions(req.query);
    const items = await service.getApplicationModules(
      paginationOptions,
      includeDisabled
    );
    return res.status(200).send(items);
  }
);

export const getApplicationModuleById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.getApplicationModuleById(id as string);
    if (!item)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(item);
  }
);

export const updateAppplicationModule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const updated = await service.updateApplicationModule(
      id as string,
      payload
    );
    if (!updated)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(updated);
  }
);

export const updateApplicationModuleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const status = req.body?.status;

    const updated = await service.updateApplicationModule(id as string, {
      status
    });
    if (!updated)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(updated);
  }
);

export const deleteApplicationModule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await service.deleteApplicationModule(id as string);
    if (!deleted)
      return res.status(404).json({ message: "Application not found" });
    return res
      .status(200)
      .send({ message: "Application Module deleted", application: deleted });
  }
);

export const bulkDeleteApplicationModules = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDeleteApplicationModules(ids);
    res.status(200).send(result);
  }
);

export const bulkDuplicateApplicationModules = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    const currentUser = (req as any).user?.id ?? null;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDuplicateApplicationModules(
      ids,
      currentUser
    );
    res.status(201).send(result);
  }
);

// No enable/disable functions exist for this module — only the generic status
// PATCH updateApplicationModule already uses; restore reuses that.
const bulkCrud = buildBulkCrudRoutes({
  model: AppModule,
  nameField: "moduleName",
  createDtoClass: CreateAppModuleDto,
  createOne: (payload, currentUser) =>
    service.createApplicationModule(payload, currentUser ?? ""),
  updateOne: (id, payload) => service.updateApplicationModule(id, payload),
  restore: (id) => service.updateApplicationModule(id, { status: "enabled" })
});

export const bulkCopyApplicationModules = bulkCrud.bulkCopy;
export const bulkUpdateApplicationModules = bulkCrud.bulkUpdate;
export const bulkRestoreApplicationModules = bulkCrud.bulkRestore!;
