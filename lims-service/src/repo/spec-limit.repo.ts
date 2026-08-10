import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import SpecLimit from "../models/spec-limit.model";
import Specification from "../models/specification.model";
import AnalysisComponent from "../models/analysis-component.model";
import { Transaction } from "sequelize";

export const createSpecLimitRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await SpecLimit.create(data, { transaction }));
};

export const updateSpecLimitRepo = async (id: string, data: any, transaction?: Transaction) => {
  await SpecLimit.update(data, { where: { id }, transaction });
  return await getSpecLimitByIdRepo(id, transaction);
};

export const getSpecLimitByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await SpecLimit.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Specification, as: "specification" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    transaction 
  }));
};

export const getAllSpecLimitsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await SpecLimit.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(SpecLimit, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Specification, as: "specification" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteSpecLimitRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await SpecLimit.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
