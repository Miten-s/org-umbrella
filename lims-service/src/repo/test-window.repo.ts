import TestWindow from "../models/test-window.model";
import Test from "../models/test.model";
import AnalysisComponent from "../models/analysis-component.model";
import { Transaction } from "sequelize";

export const createTestWindowRepo = async (data: any, transaction?: Transaction) => {
  return await TestWindow.create(data, { transaction });
};

export const updateTestWindowRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestWindow.update(data, { where: { id }, transaction });
  return await getTestWindowByIdRepo(id, transaction);
};

export const getTestWindowByIdRepo = async (id: string, transaction?: Transaction) => {
  return await TestWindow.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Test, as: "test" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    transaction 
  });
};

export const getAllTestWindowsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await TestWindow.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [
      { model: Test, as: "test" },
      { model: AnalysisComponent, as: "analysisComponent" }
    ],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteTestWindowRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestWindow.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
