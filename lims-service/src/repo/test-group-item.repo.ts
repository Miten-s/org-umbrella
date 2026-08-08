import TestGroupItem from "../models/test-group-item.model";
import Analysis from "../models/analysis.model";
import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createTestGroupItemRepo = async (data: any, transaction?: Transaction) => {
  return await TestGroupItem.create(data, { transaction });
};

export const updateTestGroupItemRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestGroupItem.update(data, { where: { id }, transaction });
  return await getTestGroupItemByIdRepo(id, transaction);
};

export const getTestGroupItemByIdRepo = async (id: string, transaction?: Transaction) => {
  return await TestGroupItem.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Analysis, as: "analysis" },
      { model: TestGroup, as: "testGroup" }
    ],
    transaction 
  });
};

export const getAllTestGroupItemsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await TestGroupItem.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [
      { model: Analysis, as: "analysis" },
      { model: TestGroup, as: "testGroup" }
    ],
    offset: skip,
    limit,
    order: [["sortOrder", "ASC"]]
  });
};

export const deleteTestGroupItemRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestGroupItem.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
