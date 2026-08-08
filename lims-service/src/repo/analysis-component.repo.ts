import AnalysisComponent from "../models/analysis-component.model";
import Analysis from "../models/analysis.model";
import { Transaction } from "sequelize";

export const createAnalysisComponentRepo = async (data: any, transaction?: Transaction) => {
  return await AnalysisComponent.create(data, { transaction });
};

export const updateAnalysisComponentRepo = async (id: string, data: any, transaction?: Transaction) => {
  await AnalysisComponent.update(data, { where: { id }, transaction });
  return await getAnalysisComponentByIdRepo(id, transaction);
};

export const getAnalysisComponentByIdRepo = async (id: string, transaction?: Transaction) => {
  return await AnalysisComponent.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: Analysis, as: "analysis" }],
    transaction 
  });
};

export const getAllAnalysisComponentsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await AnalysisComponent.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Analysis, as: "analysis" }],
    offset: skip,
    limit,
    order: [["sortOrder", "ASC"]]
  });
};

export const deleteAnalysisComponentRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await AnalysisComponent.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
