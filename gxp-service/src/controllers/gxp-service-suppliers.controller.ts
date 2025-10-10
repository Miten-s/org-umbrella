// src/controllers/gxpSupplier.controller.ts
import { Request, Response } from "express";
import * as service from "../services/gxp-service-suppliers.service";
import asyncHandler from "../middlewares/error.middleware";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const payload = req.body;
  const created = await service.createSupplier(
    payload,
    currentUser ?? undefined
  );
  return res.status(201).json(created);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeDisabled = req.query.includeDisabled === "true";
  const items = await service.listSuppliers(includeDisabled);
  return res.json(items);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await service.getSupplier(id);
  if (!item) return res.status(404).json({ message: "Supplier not found" });
  return res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const updated = await service.updateSupplier(
    id,
    payload,
    currentUser ?? undefined
  );
  if (!updated) return res.status(404).json({ message: "Supplier not found" });
  return res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const disabled = await service.disableSupplier(id, currentUser ?? undefined);
  if (!disabled) return res.status(404).json({ message: "Supplier not found" });
  return res.json({ message: "Supplier disabled", supplier: disabled });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = req.body?.comments ?? null;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const restored = await service.enableSupplier(id, currentUser ?? undefined);
  if (!restored) return res.status(404).json({ message: "Supplier not found" });
  return res.json({
    message: "Supplier restored",
    supplier: restored,
    comments
  });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "");
  const limit = Number(req.query.limit ?? 20);
  const results = await service.searchSuppliers(q, limit);
  return res.json(results);
});
