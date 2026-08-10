import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import AnalysisComponent from "../models/analysis-component.model";
import Analysis from "../models/analysis.model";
import { Transaction } from "sequelize";

export const createAnalysisComponentRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await AnalysisComponent.create(data, { transaction }));
};

export const updateAnalysisComponentRepo = async (id: string, data: any, transaction?: Transaction) => {
  await AnalysisComponent.update(data, { where: { id }, transaction });
  return await getAnalysisComponentByIdRepo(id, transaction);
};

export const getAnalysisComponentByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await AnalysisComponent.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: PhraseEntry, as: "componentTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Analysis, as: "analysis" }],
    transaction 
  }));
};

export const getAllAnalysisComponentsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await AnalysisComponent.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(AnalysisComponent, filters) },
    include: [
      { model: PhraseEntry, as: "componentTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: PhraseEntry, as: "unitPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Analysis, as: "analysis" }],
    offset: skip,
    limit,
    order: [["sortOrder", "ASC"]]
  }));
};

export const deleteAnalysisComponentRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await AnalysisComponent.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
