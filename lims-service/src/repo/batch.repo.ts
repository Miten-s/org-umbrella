import Batch from "../models/batch.model";
import { Transaction } from "sequelize";

export const createBatchRepo = async (data: any, transaction?: Transaction) => {
  return await Batch.create(data, { transaction });
};

export const updateBatchRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Batch.update(data, { where: { id }, transaction });
  return await getBatchByIdRepo(id, transaction);
};

export const getBatchByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Batch.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllBatchesRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Batch.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteBatchRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Batch.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
