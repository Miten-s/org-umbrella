import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import Aliquot from "../models/aliquot.model";
import StockBatch from "../models/stock-batch.model";
import { Transaction } from "sequelize";

export const createAliquotRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Aliquot.create(data, { transaction }));
};

export const updateAliquotRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Aliquot.update(data, { where: { id }, transaction });
  return await getAliquotByIdRepo(id, transaction);
};

export const getAliquotByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Aliquot.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: StockBatch, as: "batch" }],
    transaction 
  }));
};

export const getAllAliquotsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Aliquot.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Aliquot, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: StockBatch, as: "batch" }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteAliquotRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Aliquot.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
