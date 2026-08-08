import Result from "../models/result.model";
import TestWindow from "../models/test-window.model";
import { Transaction } from "sequelize";

export const createResultRepo = async (data: any, transaction?: Transaction) => {
  return await Result.create(data, { transaction });
};

export const updateResultRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Result.update(data, { where: { id }, transaction });
  return await getResultByIdRepo(id, transaction);
};

export const getResultByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Result.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: TestWindow, as: "testWindow" }],
    transaction 
  });
};

export const getAllResultsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Result.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: TestWindow, as: "testWindow" }],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteResultRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Result.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
