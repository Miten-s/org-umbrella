import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import StockParameter from "../models/stock-parameter.model";
import { Transaction } from "sequelize";

export const createStockParameterRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await StockParameter.create(data, { transaction }));
};

export const updateStockParameterRepo = async (id: string, data: any, transaction?: Transaction) => {
  await StockParameter.update(data, { where: { id }, transaction });
  return await getStockParameterByIdRepo(id, transaction);
};

export const getStockParameterByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await StockParameter.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllStockParametersRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await StockParameter.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(StockParameter, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteStockParameterRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await StockParameter.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
