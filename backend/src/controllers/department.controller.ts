import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";

export const createDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    await departmentService.createDepartment(req.body, req.user?.fullName);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_CREATED.replace(
        "{{ entity }}",
        "Department"
      )
    });
  }
);

export const getAllDepartments = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json({ departments });
  }
);

export const getDepartmentById = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.getDepartmentById(req.params.id);
    if (!department)
      return res.status(404).json({ error: "Department not found" });
    res.status(200).json({ department });
  }
);

export const updateDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body,
      req.user?._id
    );
    if (!department)
      return res.status(404).json({ error: "Department not found" });
    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace(
        "{{ entity }}",
        "Department"
      )
    });
  }
);

export const deleteDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.deleteDepartment(req.params.id);

    if (!department)
      return res.status(404).json({ error: "Department not found" });
    res.status(200).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace(
        "{{ entity }}",
        "Department"
      )
    });
  }
);
