import StockParameter from "../models/stock-parameter.model";
import { Transaction } from "sequelize";

export const createStockParameterRepo = async (data: any, transaction?: Transaction) => {
  return await StockParameter.create(data, { transaction });
};

export const updateStockParameterRepo = async (id: string, data: any, transaction?: Transaction) => {
  await StockParameter.update(data, { where: { id }, transaction });
  return await getStockParameterByIdRepo(id, transaction);
};

export const getStockParameterByIdRepo = async (id: string, transaction?: Transaction) => {
  return await StockParameter.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllStockParametersRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await StockParameter.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteStockParameterRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await StockParameter.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
