import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as companyService from "../services/company.service";
import { CUSTOM_MESSAGES } from "../utils/common.util";

export const updateCompany = asyncHandler(
  async (req: Request, res: Response) => {
    await companyService.updateCompany(req);
    res.status(201).json({
      message: CUSTOM_MESSAGES.ENTITY_UPDATED.replace("{{ entity }}", "Company")
    });
  }
);

export const getAllCompanies = asyncHandler(
  async (_req: Request, res: Response) => {
    const company = await companyService.getCompany();
    res.status(200).json({ company });
  }
);
