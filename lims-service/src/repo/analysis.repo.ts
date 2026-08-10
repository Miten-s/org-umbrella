import { formatLimsEntity } from "../utils/format.util";
import AnalysisComponent from "../models/analysis-component.model";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Analysis from "../models/analysis.model";
import InspectionPlan from "../models/inspection-plan.model";
import { Transaction } from "sequelize";

export const createAnalysisRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Analysis.create(data, { transaction }));
};

export const updateAnalysisRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Analysis.update(data, { where: { id }, transaction });
  return await getAnalysisByIdRepo(id, transaction);
};

export const getAnalysisByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Analysis.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: AnalysisComponent, as: "components", required: false },
      { model: PhraseEntry, as: "approvalStatusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: InspectionPlan, as: "inspectionPlan" }],
    transaction 
  }));
};

export const getAllAnalysesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Analysis.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Analysis, filters) },
    include: [
      { model: AnalysisComponent, as: "components", required: false },
      { model: PhraseEntry, as: "approvalStatusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: InspectionPlan, as: "inspectionPlan" }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteAnalysisRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Analysis.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
