import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Instrument from "../models/instrument.model";
import { Transaction } from "sequelize";

export const createInstrumentRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Instrument.create(data, { transaction }));
};

export const updateInstrumentRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Instrument.update(data, { where: { id }, transaction });
  return await getInstrumentByIdRepo(id, transaction);
};

export const getInstrumentByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Instrument.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllInstrumentsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Instrument.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Instrument, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteInstrumentRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Instrument.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
