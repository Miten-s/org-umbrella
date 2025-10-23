import { Request, Response } from "express";
import * as service from "../services/gxp-service-applications.service";
import asyncHandler from "../middlewares/error.middleware";

export const createApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = (req as any).user?.username ?? null;
    const payload = req.body;
    const created = await service.create(payload, currentUser ?? undefined);
    return res.status(201).json(created);
  }
);

export const getApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const items = await service.list(includeDisabled);
    return res.status(200).send(items);
  }
);

export const getApplicationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.getById(id);
    if (!item)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(item);
  }
);

export const updateAppplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const updated = await service.update(id, payload, currentUser ?? undefined);
    if (!updated)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(updated);
  }
);

export const disableApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const disabled = await service.remove(id, currentUser ?? undefined);
    if (!disabled)
      return res.status(404).json({ message: "Application not found" });
    return res
      .status(200)
      .send({ message: "Application disabled", application: disabled });
  }
);

export const enableApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;
    const restored = await service.restore(id, currentUser ?? undefined);
    if (!restored)
      return res.status(404).json({ message: "Application not found" });
    return res
      .status(200)
      .send({ message: "Application restored", application: restored });
  }
);

export const deleteApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await service.deleteApplication(id);
    if (!deleted)
      return res.status(404).json({ message: "Application not found" });
    return res
      .status(200)
      .send({ message: "Application deleted", application: deleted });
  }
);
