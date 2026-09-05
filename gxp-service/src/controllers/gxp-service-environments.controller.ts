import { Request, Response } from "express";
import * as service from "../services/gxp-service-environments.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import { buildBulkCrudRoutes } from "../utils/bulk-crud-factory";
import Environment from "../models/gxp-service-environments.model";
import { CreateEnvironmentDto } from "../dtos/environment.dto";

export const createEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = (req as any).user?.id ?? null;
    const result = await service.addNewEnvironment(req.body, currentUser);
    res.status(201).send(result);
  }
);

export const getEnvironments = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const paginationOptions = getPaginationOptions(req.query);
    const result = await service.getAllEnvironments(
      paginationOptions,
      includeDisabled
    );
    res.status(200).send(result);
  }
);

export const getEnvironmentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.getEnvironmentById(id as string);
    if (!result)
      return res.status(404).json({ message: "Environment not found" });
    res.status(200).send(result);
  }
);

export const updateEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = (req as any).user?.id ?? null;
    const result = await service.updateEnvironment(
      id as string,
      req.body,
      currentUser
    );
    res.status(200).send(result);
  }
);

export const disableEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.disableEnvironment(id as string);
    res.status(200).send(result);
  }
);

export const enableEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.restoreEnvironment(id as string);
    res.status(200).send(result);
  }
);

export const deleteEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.deleteEnvironment(id as string);
    res.status(200).send(result);
  }
);

export const bulkDeleteEnvironments = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDeleteEnvironments(ids);
    res.status(200).send(result);
  }
);

export const bulkDuplicateEnvironments = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    const currentUser = (req as any).user?.id ?? null;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDuplicateEnvironments(ids, currentUser);
    res.status(201).send(result);
  }
);

const bulkCrud = buildBulkCrudRoutes({
  model: Environment,
  nameField: "environmentName",
  createDtoClass: CreateEnvironmentDto,
  createOne: service.addNewEnvironment,
  updateOne: service.updateEnvironment,
  restore: service.restoreEnvironment
});

export const bulkCopyEnvironments = bulkCrud.bulkCopy;
export const bulkUpdateEnvironments = bulkCrud.bulkUpdate;
export const bulkRestoreEnvironments = bulkCrud.bulkRestore!;
