import { formatLimsEntity } from "../utils/format.util";
import StockParameter from "../models/stock-parameter.model";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Stock from "../models/stock.model";
import { Transaction } from "sequelize";

export const createStockRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Stock.create(data, { transaction }));
};

export const updateStockRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Stock.update(data, { where: { id }, transaction });
  return await getStockByIdRepo(id, transaction);
};

export const getStockByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Stock.findOne({ where: { id, isDeleted: false },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }, { model: PhraseEntry, as: "stockTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllStockRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Stock.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Stock, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }, { model: PhraseEntry, as: "stockTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteStockRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Stock.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
