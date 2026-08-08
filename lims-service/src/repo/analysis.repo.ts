import Analysis from "../models/analysis.model";
import InspectionPlan from "../models/inspection-plan.model";
import { Transaction } from "sequelize";

export const createAnalysisRepo = async (data: any, transaction?: Transaction) => {
  return await Analysis.create(data, { transaction });
};

export const updateAnalysisRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Analysis.update(data, { where: { id }, transaction });
  return await getAnalysisByIdRepo(id, transaction);
};

export const getAnalysisByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Analysis.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: InspectionPlan, as: "inspectionPlan" }],
    transaction 
  });
};

export const getAllAnalysesRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Analysis.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: InspectionPlan, as: "inspectionPlan" }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteAnalysisRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Analysis.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
