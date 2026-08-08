import StockBatch from "../models/stock-batch.model";
import Stock from "../models/stock.model";
import { Transaction } from "sequelize";

export const createStockBatchRepo = async (data: any, transaction?: Transaction) => {
  return await StockBatch.create(data, { transaction });
};

export const updateStockBatchRepo = async (id: string, data: any, transaction?: Transaction) => {
  await StockBatch.update(data, { where: { id }, transaction });
  return await getStockBatchByIdRepo(id, transaction);
};

export const getStockBatchByIdRepo = async (id: string, transaction?: Transaction) => {
  return await StockBatch.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: Stock, as: "stock" }],
    transaction 
  });
};

export const getAllStockBatchesRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await StockBatch.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Stock, as: "stock" }],
    offset: skip,
    limit,
    order: [["receivedDate", "DESC"]]
  });
};

export const deleteStockBatchRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await StockBatch.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
