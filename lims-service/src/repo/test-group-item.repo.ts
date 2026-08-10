import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import TestGroupItem from "../models/test-group-item.model";
import Analysis from "../models/analysis.model";
import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createTestGroupItemRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await TestGroupItem.create(data, { transaction }));
};

export const updateTestGroupItemRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestGroupItem.update(data, { where: { id }, transaction });
  return await getTestGroupItemByIdRepo(id, transaction);
};

export const getTestGroupItemByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await TestGroupItem.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Analysis, as: "analysis" },
      { model: TestGroup, as: "testGroup" }
    ],
    transaction 
  }));
};

export const getAllTestGroupItemsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await TestGroupItem.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(TestGroupItem, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Analysis, as: "analysis" },
      { model: TestGroup, as: "testGroup" }
    ],
    offset: skip,
    limit,
    order: [["sortOrder", "ASC"]]
  }));
};

export const deleteTestGroupItemRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestGroupItem.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
