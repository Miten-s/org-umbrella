import { formatLimsEntity } from "../utils/format.util";
import TestWindow from "../models/test-window.model";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Test from "../models/test.model";
import Sample from "../models/sample.model";
import Analysis from "../models/analysis.model";
import { Transaction } from "sequelize";

export const createTestRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Test.create(data, { transaction }));
};

export const updateTestRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Test.update(data, { where: { id }, transaction });
  return await getTestByIdRepo(id, transaction);
};

export const getTestByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Test.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: TestWindow, as: "testWindows", required: false },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Sample, as: "sample" },
      { model: Analysis, as: "analysis" }
    ],
    transaction 
  }));
};

export const getAllTestsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Test.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Test, filters) },
    include: [
      { model: TestWindow, as: "testWindows", required: false },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Sample, as: "sample" },
      { model: Analysis, as: "analysis" }
    ],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteTestRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Test.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
