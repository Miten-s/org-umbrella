import { Request, Response } from "express";
import * as designationService from "../services/designation.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";

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
  async (_req: Request, res: Response): Promise<any> => {
    const designations = await designationService.getAllDesignations();
    res.status(200).json({ designations });
  }
);

export const getDesignationByName = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.getDesignationById(
      req.params.id
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json({ designation });
  }
);

export const updateDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.updateDesignation(
      req.params.id,
      req.body
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json({ designation });
  }
);

export const deleteDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.deleteDesignation(
      req.params.id
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });

    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_DELETED.replace(
        "{{ entity }}",
        "Designation"
      )
    });
  }
);
