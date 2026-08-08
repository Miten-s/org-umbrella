import Sample from "../models/sample.model";
import Lot from "../models/lot.model";
import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createSampleRepo = async (data: any, transaction?: Transaction) => {
  return await Sample.create(data, { transaction });
};

export const updateSampleRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Sample.update(data, { where: { id }, transaction });
  return await getSampleByIdRepo(id, transaction);
};

export const getSampleByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Sample.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Lot, as: "lot" },
      { model: TestGroup, as: "testGroup" }
    ],
    transaction 
  });
};

export const getAllSamplesRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Sample.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [
      { model: Lot, as: "lot" },
      { model: TestGroup, as: "testGroup" }
    ],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteSampleRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Sample.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
