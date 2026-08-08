import Customer from "../models/customer.model";
import { Transaction } from "sequelize";

export const createCustomerRepo = async (data: any, transaction?: Transaction) => {
  return await Customer.create(data, { transaction });
};

export const updateCustomerRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Customer.update(data, { where: { id }, transaction });
  return await getCustomerByIdRepo(id, transaction);
};

export const getCustomerByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Customer.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllCustomersRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Customer.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteCustomerRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Customer.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
