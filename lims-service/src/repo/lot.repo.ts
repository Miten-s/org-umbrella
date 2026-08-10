import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Lot from "../models/lot.model";
import Batch from "../models/batch.model";
import { Transaction } from "sequelize";

export const createLotRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Lot.create(data, { transaction }));
};

export const updateLotRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Lot.update(data, { where: { id }, transaction });
  return await getLotByIdRepo(id, transaction);
};

export const getLotByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Lot.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Batch, as: "batch" }],
    transaction 
  }));
};

export const getAllLotsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Lot.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Lot, filters) },
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Batch, as: "batch" }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteLotRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Lot.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
