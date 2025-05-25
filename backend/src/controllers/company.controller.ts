import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as companyService from "../services/company.service";

export const createCompany = asyncHandler(
  async (req: Request, res: Response) => {
    const newCompany = await companyService.createCompany(req);
    res.status(201).json({ company: newCompany });
  }
);

export const getAllCompanies = asyncHandler(
  async (req: Request, res: Response) => {
    const company = await companyService.getCompany();
    res.status(200).json({ company });
  }
);
