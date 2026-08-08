import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as customerService from "../services/customer.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Customer"), data: customer });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const customer = await customerService.updateCustomer(id, req.body);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Customer"), data: customer });
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const customer = await customerService.getCustomerById(id);
  res.status(200).json({ data: customer });
});

export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await customerService.getAllCustomers(page, limit);
  res.status(200).json({
    data: result.customers,
    metadata: { totalCount: result.total, currentPage: page, limit, totalPages: Math.ceil(result.total / limit) }
  });
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system";
  await customerService.deleteCustomer(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Customer") });
});
