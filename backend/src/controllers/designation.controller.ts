import { Request, Response } from "express";
import * as designationService from "../services/designation.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { getPaginationOptions } from "../utils/pagination.util";

export const createDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    await designationService.createDesignation(req.body);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace(
        "{{ entity }}",
        "Designation"
      )
    });
  }
);

export const getAllDesignations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = getPaginationOptions(req.query);
    const result =
      await designationService.getAllDesignations(paginationOptions);
    res.status(200).json(result);
  }
);

export const getDesignationByName = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.getDesignationById(
      req.params.id as string
    );
    if (!designation)
      return res.status(404).json({ error: "Designation not found" });
    res.status(200).json({ designation });
  }
);

export const updateDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.updateDesignation(
      req.params.id as string,
      req.body
    );
    if (!designation)
      return res.status(404).json({ error: "Designation not found" });
    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace(
        "{{ entity }}",
        "Designation"
      )
    });
  }
);

export const deleteDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.deleteDesignation(
      req.params.id as string
    );
    if (!designation)
      return res.status(404).json({ error: "Designation not found" });

    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace(
        "{{ entity }}",
        "Designation"
      )
    });
  }
);

export const bulkDeleteDesignations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await designationService.bulkDeleteDesignations(ids);
    res.status(200).json({ message: "Designations deleted", result });
  }
);
