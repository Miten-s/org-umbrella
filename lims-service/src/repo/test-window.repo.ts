import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import TestWindow from "../models/test-window.model";
import Test from "../models/test.model";
import AnalysisComponent from "../models/analysis-component.model";
import { Transaction } from "sequelize";

export const createTestWindowRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await TestWindow.create(data, { transaction }));
};

export const updateTestWindowRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestWindow.update(data, { where: { id }, transaction });
  return await getTestWindowByIdRepo(id, transaction);
};

export const getTestWindowByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await TestWindow.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Test, as: "test" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    transaction 
  }));
};

export const getAllTestWindowsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await TestWindow.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(TestWindow, filters) },
    include: [
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Test, as: "test" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteTestWindowRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestWindow.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
