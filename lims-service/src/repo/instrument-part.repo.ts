import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import InstrumentPart from "../models/instrument-part.model";
import Instrument from "../models/instrument.model";
import { Transaction } from "sequelize";

export const createInstrumentPartRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await InstrumentPart.create(data, { transaction }));
};

export const updateInstrumentPartRepo = async (id: string, data: any, transaction?: Transaction) => {
  await InstrumentPart.update(data, { where: { id }, transaction });
  return await getInstrumentPartByIdRepo(id, transaction);
};

export const getInstrumentPartByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await InstrumentPart.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" }],
    transaction 
  }));
};

export const getAllInstrumentPartsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await InstrumentPart.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(InstrumentPart, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" }],
    offset: skip,
    limit,
    order: [["partName", "ASC"]]
  }));
};

export const deleteInstrumentPartRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await InstrumentPart.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
