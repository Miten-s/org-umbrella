import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Sample from "../models/sample.model";
import Lot from "../models/lot.model";
import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createSampleRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Sample.create(data, { transaction }));
};

export const updateSampleRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Sample.update(data, { where: { id }, transaction });
  return await getSampleByIdRepo(id, transaction);
};

export const getSampleByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Sample.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Lot, as: "lot" },
      { model: TestGroup, as: "testGroup" }
    ],
    transaction 
  }));
};

export const getAllSamplesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Sample.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Sample, filters) },
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Lot, as: "lot" },
      { model: TestGroup, as: "testGroup" }
    ],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteSampleRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Sample.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
