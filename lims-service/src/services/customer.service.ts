import * as repo from "../repo/customer.repo";
import { AppError } from "../types/common.types";

export const createCustomer = async (data: any) => {
  return await repo.createCustomerRepo(data);
};

export const updateCustomer = async (id: string, data: any) => {
  const existing = await repo.getCustomerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return await repo.updateCustomerRepo(id, data);
};

export const getCustomerById = async (id: string) => {
  const customer = await repo.getCustomerByIdRepo(id);
  if (!customer) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return customer;
};

export const getAllCustomers = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllCustomersRepo(skip, limit, filters);
  return { customers: rows, total: count };
};

export const deleteCustomer = async (id: string, deletedBy: string) => {
  const existing = await repo.getCustomerByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  await repo.deleteCustomerRepo(id, deletedBy);
};
