import { Request, Response } from "express";
import * as service from "../services/gxp-service-service-requests.service.js";
import asyncHandler from "../middlewares/error.middleware.js";

export const createServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body;
    const user = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    const attachments = files?.map((file) => file.filename) || [];

    const newRequest = await service.createServiceRequest({
      ...data,
      createdBy: user,
      attachments
    });

    res.status(201).send(newRequest);
  }
);

export const getAllSeviceRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await service.fetchAllRequests();
    res.status(200).send(result);
  }
);

export const getServiceRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.fetchRequestById(id);
    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const updateServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const files = req.files as Express.Multer.File[];

    const attachments = files?.map((file) => file.filename) || [];
    const result = await service.updateRequest(id, {
      ...data,
      attachments
    });

    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const updateStatusOfRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status) return res.status(400).json({ message: "Status Not Found" });

    const result = await service.updateRequest(id, { status, comments });

    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const deleteServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.deleteRequest(id);
    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const deleteAttachments = asyncHandler(
  async (req: Request, res: Response) => {
    const { attachmentId: id } = req.params;
    if (!id)
      return res.status(404).json({ message: "Attachment Id is required" });

    const result = await service.deleteAttachments(id);

    res.status(200).send(result);
  }
);
