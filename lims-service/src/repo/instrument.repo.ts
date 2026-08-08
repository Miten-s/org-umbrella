import Instrument from "../models/instrument.model";
import { Transaction } from "sequelize";

export const createInstrumentRepo = async (data: any, transaction?: Transaction) => {
  return await Instrument.create(data, { transaction });
};

export const updateInstrumentRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Instrument.update(data, { where: { id }, transaction });
  return await getInstrumentByIdRepo(id, transaction);
};

export const getInstrumentByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Instrument.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllInstrumentsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Instrument.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteInstrumentRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Instrument.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
