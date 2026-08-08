import Stock from "../models/stock.model";
import { Transaction } from "sequelize";

export const createStockRepo = async (data: any, transaction?: Transaction) => {
  return await Stock.create(data, { transaction });
};

export const updateStockRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Stock.update(data, { where: { id }, transaction });
  return await getStockByIdRepo(id, transaction);
};

export const getStockByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Stock.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllStockRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Stock.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteStockRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Stock.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
