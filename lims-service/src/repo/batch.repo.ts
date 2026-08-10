import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Batch from "../models/batch.model";
import { Transaction } from "sequelize";

export const createBatchRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Batch.create(data, { transaction }));
};

export const updateBatchRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Batch.update(data, { where: { id }, transaction });
  return await getBatchByIdRepo(id, transaction);
};

export const getBatchByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Batch.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllBatchesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Batch.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Batch, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteBatchRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Batch.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
