import { Request, Response } from "express";
import * as service from "../services/gxp-service-service-requests.service.js";
import asyncHandler from "../middlewares/error.middleware.js";

export const createServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];
    const trainingEvidence = files?.map((file) => file.path) || [];

    const newRequest = await service.createServiceRequest({
      ...data,
      trainingEvidence
    });

    res.status(201).send(newRequest);
  }
);

export const getAllSeviceRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const all = await service.fetchAllRequests();
    res.status(200).send(all);
  }
);

export const getServiceRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const request = await service.fetchRequestById(id);
    if (!request) return res.status(404).json({ message: "Not Found" });
    res.status(200).send(request);
  }
);
