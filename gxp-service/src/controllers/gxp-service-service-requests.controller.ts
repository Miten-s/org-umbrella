import { Request, Response } from "express";
import {
  createServiceRequest,
  fetchAllRequests,
  fetchRequestById
} from "../services/gxp-service-service-requests.service.js";
import asyncHandler from "../middlewares/error.middleware.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const files = req.files as Express.Multer.File[];
  const trainingEvidence = files?.map((file) => file.path) || [];
  const newRequest = await createServiceRequest({
    ...data,
    trainingEvidence
  });

  res.status(201).json({ success: true, data: newRequest });
});

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const all = await fetchAllRequests();
  res.json({ success: true, data: all });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await fetchRequestById(id);
  if (!request) return res.status(404).json({ message: "Not Found" });
  res.json({ success: true, data: request });
});
