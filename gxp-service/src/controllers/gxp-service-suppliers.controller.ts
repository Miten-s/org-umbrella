import { Request, Response } from "express";
import * as service from "../services/gxp-service-suppliers.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const payload = req.body;
    const created = await service.createSupplier(
      payload,
      currentUser ?? undefined
    );
    return res.status(201).json(created);
  }
);

export const getSuppliers = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const paginationOptions = getPaginationOptions(req.query);
    const items = await service.listSuppliers(paginationOptions, includeDisabled);
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
    return res.json({ message: "Supplier deleted", supplier: deleted });
  }
);
