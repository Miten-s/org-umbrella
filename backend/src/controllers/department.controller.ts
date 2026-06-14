import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import asyncHandler from "../middlewares/error.middleware";
import { CUSTOM_MESSAGES } from "../utils/common.util";
import { getPaginationOptions } from "../utils/pagination.util";

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
  async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = getPaginationOptions(req.query);
    const result = await departmentService.getAllDepartments(paginationOptions);
    res.status(200).json(result);
  }
);

export const getDepartmentById = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.getDepartmentById(
      req.params.id as string
    );
    if (!department)
      return res.status(404).json({ error: "Department not found" });
    res.status(200).json({ department });
  }
);

export const updateDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.updateDepartment(
      req.params.id as string,
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
    const department = await departmentService.deleteDepartment(
      req.params.id as string
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

export const bulkDeleteDepartments = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await departmentService.bulkDeleteDepartments(ids);
    res.status(200).json({ message: "Departments deleted", result });
  }
);

export const bulkDuplicateDepartments = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "An array of ids is required" });
    const result = await departmentService.bulkDuplicateDepartments(
      ids,
      req.user
    );
    res.status(201).json({ message: "Departments duplicated", result });
  }
);
