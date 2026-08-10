import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import Result from "../models/result.model";
import TestWindow from "../models/test-window.model";
import { Transaction } from "sequelize";

export const createResultRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Result.create(data, { transaction }));
};

export const updateResultRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Result.update(data, { where: { id }, transaction });
  return await getResultByIdRepo(id, transaction);
};

export const getResultByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Result.findOne({ 
    where: { id, isDeleted: false, isLatest: true }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: TestWindow, as: "testWindow" }],
    transaction 
  }));
};

export const getAllResultsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Result.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), isLatest: true, ...getSafeFilters(Result, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: TestWindow, as: "testWindow" }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteResultRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Result.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
