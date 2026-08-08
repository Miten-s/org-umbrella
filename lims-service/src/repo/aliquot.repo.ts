import Aliquot from "../models/aliquot.model";
import StockBatch from "../models/stock-batch.model";
import { Transaction } from "sequelize";

export const createAliquotRepo = async (data: any, transaction?: Transaction) => {
  return await Aliquot.create(data, { transaction });
};

export const updateAliquotRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Aliquot.update(data, { where: { id }, transaction });
  return await getAliquotByIdRepo(id, transaction);
};

export const getAliquotByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Aliquot.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: StockBatch, as: "batch" }],
    transaction 
  });
};

export const getAllAliquotsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Aliquot.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: StockBatch, as: "batch" }],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteAliquotRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Aliquot.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
