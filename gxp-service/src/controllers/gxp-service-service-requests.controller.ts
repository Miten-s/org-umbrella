import { Request, Response } from "express";
import * as service from "../services/gxp-service-service-requests.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { data: payload } = req.body;
    const user = (req as any).user.id;
    const files = req.files as Express.Multer.File[];
    const attachments = files?.map((file) => file.filename) || [];

    const result = await service.createServiceRequest(
      {
        ...payload,
        createdBy: user
      },
      attachments
    );

    res.status(201).send(result);
  }
);

export const getAllSeviceRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const paginationOptions = getPaginationOptions(req.query);
    const result = await service.fetchAllRequests(paginationOptions);
    res.status(200).send(result);
  }
);

export const getServiceRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.fetchRequestById(id as string);
    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const getServiceTypes = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await service.getServiceTypes(req);
    res.status(200).send({ service_types: result });
  }
);

export const updateServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data: payload } = req.body;

    const files = req.files as Express.Multer.File[];
    const attachments = files?.map((file) => file.filename) || [];

    const result = await service.updateRequest(id as string, payload, attachments);

    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const updateStatusOfRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status) return res.status(400).json({ message: "Status Not Found" });

    const result = await service.updateRequest(id as string, {
      status,
      comments
    });

    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const deleteServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.deleteRequest(id as string);
    if (!result) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(result);
  }
);

export const bulkDeleteServiceRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "An array of ids is required" });
    }
    const result = await service.bulkDeleteRequests(ids);
    res.status(200).send(result);
  }
);
