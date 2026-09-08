import { Request, Response } from "express";
import * as service from "../services/gxp-service-suppliers.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import { buildBulkCrudRoutes } from "../utils/bulk-crud-factory";
import Supplier from "../models/gxp-service-suppliers.model";
import { CreateSupplierDto } from "../dtos/supplier.dto";
import {
  cacheResponse,
  getCachedResponse,
  deleteCacheByPrefix
} from "../configs/redis.config";

export const createSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const payload = req.body;
    const created = await service.createSupplier(
      payload,
      currentUser ?? undefined
    );
    await deleteCacheByPrefix("gxp:suppliers:");
    return res.status(201).json(created);
  }
);

export const getSuppliers = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const paginationOptions = getPaginationOptions(req.query);

    const cacheKey = `gxp:suppliers:all:${JSON.stringify({ ...paginationOptions, includeDisabled })}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return res.json(cached);

    const items = await service.listSuppliers(
      paginationOptions,
      includeDisabled
    );

    await cacheResponse({ key: cacheKey, value: items, ttl: 3600 });
    return res.json(items);
  }
);

export const getSupplierById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.getSupplier(id as string);
    if (!item) return res.status(404).json({ message: "Supplier not found" });
    return res.json(item);
  }
);

export const updateSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const updated = await service.updateSupplier(
      id as string,
      payload,
      currentUser ?? undefined
    );
    if (!updated)
      return res.status(404).json({ message: "Supplier not found" });

    await deleteCacheByPrefix("gxp:suppliers:");
    return res.json(updated);
  }
);

export const disableSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const disabled = await service.disableSupplier(
      id as string,
      currentUser ?? undefined
    );
    if (!disabled)
      return res.status(404).json({ message: "Supplier not found" });

    await deleteCacheByPrefix("gxp:suppliers:");
    return res.json({ message: "Supplier disabled", supplier: disabled });
  }
);

export const enableSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const comments = req.body?.comments ?? null;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const restored = await service.enableSupplier(
      id as string,
      currentUser ?? undefined
    );
    if (!restored)
      return res.status(404).json({ message: "Supplier not found" });

    await deleteCacheByPrefix("gxp:suppliers:");
    return res.json({
      message: "Supplier restored",
      supplier: restored,
      comments
    });
  }
);

export const deleteSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await service.deleteSupplier(id as string);
    if (!deleted)
      return res.status(404).json({ message: "Supplier not found" });

    await deleteCacheByPrefix("gxp:suppliers:");
    return res.json({ message: "Supplier deleted", supplier: deleted });
  }
);

export const bulkDeleteSuppliers = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDeleteSuppliers(ids);
    await deleteCacheByPrefix("gxp:suppliers:");
    res.status(200).send(result);
  }
);

export const bulkDuplicateSuppliers = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDuplicateSuppliers(ids, currentUser);
    await deleteCacheByPrefix("gxp:suppliers:");
    res.status(201).send(result);
  }
);

const bulkCrud = buildBulkCrudRoutes({
  model: Supplier,
  nameField: "supplierName",
  maxNameLength: 20,
  createDtoClass: CreateSupplierDto,
  createOne: async (payload, currentUser) => {
    const res = await service.createSupplier(payload, currentUser);
    await deleteCacheByPrefix("gxp:suppliers:");
    return res;
  },
  updateOne: async (id, payload, currentUser) => {
    const res = await service.updateSupplier(id, payload, currentUser);
    await deleteCacheByPrefix("gxp:suppliers:");
    return res;
  },
  restore: async (id, currentUser) => {
    const res = await service.enableSupplier(id, currentUser);
    await deleteCacheByPrefix("gxp:suppliers:");
    return res;
  }
});

export const bulkCopySuppliers = bulkCrud.bulkCopy;
export const bulkUpdateSuppliers = bulkCrud.bulkUpdate;
export const bulkRestoreSuppliers = bulkCrud.bulkRestore!;
