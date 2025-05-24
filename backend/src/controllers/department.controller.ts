import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import asyncHandler from "../middlewares/error.middleware";

export const createDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.createDepartment(
      req.body,
      req.user?.username
    );
    res.status(201).json(department);
  }
);

export const getAllDepartments = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json(departments);
  }
);

export const getDepartmentById = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.getDepartmentById(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.status(200).json(department);
  }
);

export const updateDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body,
      req.user?.username
    );
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.status(200).json(department);
  }
);

export const disableDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.disableDepartment(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.status(200).json(department);
  }
);

export const enableDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const department = await departmentService.enableDepartment(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.status(200).json(department);
  }
);
