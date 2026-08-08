import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createTestGroupRepo = async (data: any, transaction?: Transaction) => {
  return await TestGroup.create(data, { transaction });
};

export const updateTestGroupRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestGroup.update(data, { where: { id }, transaction });
  return await getTestGroupByIdRepo(id, transaction);
};

export const getTestGroupByIdRepo = async (id: string, transaction?: Transaction) => {
  return await TestGroup.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllTestGroupsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await TestGroup.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteTestGroupRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestGroup.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
