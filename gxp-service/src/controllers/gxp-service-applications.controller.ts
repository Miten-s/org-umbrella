import { Request, Response } from "express";
import * as service from "../services/gxp-service-applications.service";
import asyncHandler from "../middlewares/error.middleware";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const payload = req.body;
  const created = await service.create(payload, currentUser ?? undefined);
  return res.status(201).json(created);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeDisabled = req.query.includeDisabled === "true";
  const items = await service.list(includeDisabled);
  return res.json(items);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await service.getById(id);
  if (!item) return res.status(404).json({ message: "Application not found" });
  return res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const updated = await service.update(id, payload, currentUser ?? undefined);
  if (!updated)
    return res.status(404).json({ message: "Application not found" });
  return res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const disabled = await service.remove(id, currentUser ?? undefined);
  if (!disabled)
    return res.status(404).json({ message: "Application not found" });
  return res.json({ message: "Application disabled", application: disabled });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser =
    (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
  const restored = await service.restore(id, currentUser ?? undefined);
  if (!restored)
    return res.status(404).json({ message: "Application not found" });
  return res.json({ message: "Application restored", application: restored });
});
