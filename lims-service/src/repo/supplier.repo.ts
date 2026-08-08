import Supplier from "../models/supplier.model";
import { Transaction } from "sequelize";

export const createSupplierRepo = async (data: any, transaction?: Transaction) => {
  return await Supplier.create(data, { transaction });
};

export const updateSupplierRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Supplier.update(data, { where: { id }, transaction });
  return await getSupplierByIdRepo(id, transaction);
};

export const getSupplierByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Supplier.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllSuppliersRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Supplier.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteSupplierRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Supplier.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
