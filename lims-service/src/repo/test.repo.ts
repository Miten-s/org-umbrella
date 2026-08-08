import Test from "../models/test.model";
import Sample from "../models/sample.model";
import Analysis from "../models/analysis.model";
import { Transaction } from "sequelize";

export const createTestRepo = async (data: any, transaction?: Transaction) => {
  return await Test.create(data, { transaction });
};

export const updateTestRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Test.update(data, { where: { id }, transaction });
  return await getTestByIdRepo(id, transaction);
};

export const getTestByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Test.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Sample, as: "sample" },
      { model: Analysis, as: "analysis" }
    ],
    transaction 
  });
};

export const getAllTestsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Test.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [
      { model: Sample, as: "sample" },
      { model: Analysis, as: "analysis" }
    ],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteTestRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Test.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
