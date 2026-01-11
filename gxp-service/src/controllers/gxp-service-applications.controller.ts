import { Request, Response } from "express";
import * as service from "../services/gxp-service-applications.service";
import asyncHandler from "../middlewares/error.middleware";

export const createApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = (req as any).user?.id ?? null;
    const { data: payload } = req.body;
    const files = req.files as Express.Multer.File[];
    const attachments = files?.map((file) => file.filename) || [];

    const created = await service.createApplication(
      JSON.parse(payload),
      currentUser ?? undefined,
      attachments
    );
    return res.status(201).json(created);
  }
);

export const getApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const items = await service.getApplications(includeDisabled);
    return res.status(200).send(items);
  }
);

export const getApplicationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.getApplicationById(id);
    if (!item)
      return res.status(404).json({ message: "Application not found" });
    return res.status(200).send(item);
  }
);

export const updateAppplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data: payload } = req.body;
    const currentUser =
      (req as any).user?.username ?? (req.headers["x-user"] as string) ?? null;

    const files = req.files as Express.Multer.File[];
    const attachments = files?.map((file) => file.filename) || [];

    const updated = await service.updateApplication(
      id,
      JSON.parse(payload),
      currentUser ?? undefined,
      attachments
    );

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
    const disabled = await service.disableApplication(
      id,
      currentUser ?? undefined
    );
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
    const restored = await service.enableApplication(
      id,
      currentUser ?? undefined
    );
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

export const deleteAttachments = asyncHandler(
  async (req: Request, res: Response) => {
    const { attachmentId: id } = req.params;
    if (!id) {
      return res.status(404).json({ message: "Attachment Id is required" });
    }

    const result = await service.deleteAttachments(id);
    res.status(200).send(result);
  }
);

export const getApplicationGroups = asyncHandler(
  async (_req: Request, res: Response) => {
    const applicationGroups = await service.getApplicationGroups();
    return res.status(200).send({ applicationGroups });
  }
);
