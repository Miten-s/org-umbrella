import { Request, Response } from "express";
import {
  addWorkflow,
  disable,
  enable,
  getAll,
  update
} from "../services/gxp-service-workflows.service";
import asyncHandler from "../middlewares/error.middleware";

export const createWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user?.id;
    const result = await addWorkflow(req.body, user);
    res.status(201).json(result);
  }
);

export const getAllWorkflows = asyncHandler(
  async (_req: Request, res: Response) => {
    const workflows = await getAll();
    res.json(workflows);
  }
);

export const updateWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const result = await update(workflowId, req.body);
    res.json(result);
  }
);

export const disableWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const result = await disable(workflowId);
    res.json(result);
  }
);

export const restoreWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.body;
    const result = await enable(workflowId);
    res.json(result);
  }
);
