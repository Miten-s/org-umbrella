import { Request, Response } from "express";
import * as service from "../services/gxp-service-workflows.service";
import asyncHandler from "../middlewares/error.middleware";
import { getPaginationOptions } from "../utils/pagination.util";

export const createWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user?.id;
    const result = await service.addWorkflow(req.body, user);
    res.status(201).json(result);
  }
);


export const getAllWorkflows = asyncHandler(
  async (req: Request, res: Response) => {
    const paginationOptions = getPaginationOptions(req.query);
    const workflows = await service.getWorkflows(paginationOptions);
    res.status(200).send(workflows);
  }
);

export const updateWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const user = (req as any).user?.id;
    const result = await service.updateWorkflow(
      workflowId as string,
      req.body,
      user
    );
    res.status(200).send(result);
  }
);

export const disableWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const user = (req as any).user?.id;
    const result = await service.disableWorkflow(workflowId as string, user);
    res.status(200).send(result);
  }
);

export const enableWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const user = (req as any).user?.id;
    const result = await service.enableWorkflow(workflowId as string, user);
    res.status(200).send(result);
  }
);

export const deleteWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const result = await service.deleteWorkflow(workflowId as string);
    res.status(200).send(result);
  }
);

export const bulkDeleteWorkflows = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: "Invalid workflow IDs provided for deletion" });
    }
    const result = await service.bulkDeleteWorkflows(ids);
    res.status(200).send(result);
  }
);

export const bulkDuplicateWorkflows = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: "Invalid workflow IDs provided for duplication" });
    }
    const user = (req as any).user?.id;
    const result = await service.bulkDuplicateWorkflows(ids, user);
    res.status(201).send(result);
  }
);
