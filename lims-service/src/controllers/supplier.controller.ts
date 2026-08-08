import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as supplierService from "../services/supplier.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await supplierService.createSupplier(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Supplier"), data: supplier });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const supplier = await supplierService.updateSupplier(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Supplier"), data: supplier });
});

export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const supplier = await supplierService.getSupplierById(id);
  res.status(200).json({ data: supplier });
});

export const getAllSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await supplierService.getAllSuppliers(page, limit);
  res.status(200).json({
    data: result.suppliers,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await supplierService.deleteSupplier(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Supplier") });
});
