import { Request, Response } from "express";
import * as service from "../services/gxp-service-environments.service";
import asyncHandler from "../middlewares/error.middleware";

export const createEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = (req as any).user?.id ?? null;
    const result = await service.addNewEnvironment(req.body, currentUser);
    res.status(201).send(result);
  }
);

export const getEnvironments = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await service.getAllEnvironments();
    res.status(200).send(result);
  }
);

export const updateEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = (req as any).user?.id ?? null;
    const result = await service.updateEnvironment(
      id as string,
      req.body,
      currentUser
    );
    res.status(200).send(result);
  }
);

export const disableEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.disableEnvironment(id as string);
    res.status(200).send(result);
  }
);

export const enableEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.restoreEnvironment(id as string);
    res.status(200).send(result);
  }
);

export const deleteEnvironment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.deleteEnvironment(id as string);
    res.status(200).send(result);
  }
);
