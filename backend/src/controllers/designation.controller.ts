import { Request, Response } from "express";
import * as designationService from "../services/designation.service";
import asyncHandler from "../middlewares/error.middleware";

const createDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.createDesignation(req.body);
    res.status(201).json(designation);
  }
);

const getAllDesignations = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const designations = await designationService.getAllDesignations();
    res.status(200).json(designations);
  }
);

const getDesignationByName = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.getDesignationByName(
      req.params.name
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json(designation);
  }
);

const updateDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.updateDesignation(
      req.params.name,
      req.body
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json(designation);
  }
);

const disableDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.disableDesignation(
      req.params.name
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json(designation);
  }
);

const enableDesignation = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const designation = await designationService.enableDesignation(
      req.params.name
    );
    if (!designation)
      return res.status(404).json({ message: "Designation not found" });
    res.status(200).json(designation);
  }
);

export {
  createDesignation,
  getAllDesignations,
  getDesignationByName,
  updateDesignation,
  disableDesignation,
  enableDesignation
};
