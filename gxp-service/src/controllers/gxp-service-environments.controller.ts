import { Request, Response } from "express";

import {
  addNewEnvironment,
  getAllEnvironments,
  updateEnvironment,
  disableEnvironment,
  restoreEnvironment,
  searchEnvironment
} from "../services/gxp-service-environments.service";

import asyncHandler from "../middlewares/error.middleware";

export const createEnvironmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await addNewEnvironment(req.body, null);
    res.status(201).json(result);
  }
);

export const getAllEnvironmentsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getAllEnvironments();
    res.json(result);
  }
);

export const updateEnvironmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { environmentName } = req.params;
    const result = await updateEnvironment(environmentName, req.body, null);
    res.json(result);
  }
);

export const disableEnvironmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { environmentName } = req.params;
    const result = await disableEnvironment(environmentName);
    res.json(result);
  }
);

export const restoreEnvironmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { environmentName } = req.body;
    const result = await restoreEnvironment(environmentName);
    res.json(result);
  }
);

export const searchEnvironmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { q } = req.query;
    const result = await searchEnvironment(q as string);
    res.json(result);
  }
);
