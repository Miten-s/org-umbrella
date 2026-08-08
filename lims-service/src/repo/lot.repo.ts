import Lot from "../models/lot.model";
import Batch from "../models/batch.model";
import { Transaction } from "sequelize";

export const createLotRepo = async (data: any, transaction?: Transaction) => {
  return await Lot.create(data, { transaction });
};

export const updateLotRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Lot.update(data, { where: { id }, transaction });
  return await getLotByIdRepo(id, transaction);
};

export const getLotByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Lot.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: Batch, as: "batch" }],
    transaction 
  });
};

export const getAllLotsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Lot.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Batch, as: "batch" }],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteLotRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Lot.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
