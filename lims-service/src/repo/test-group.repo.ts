import { formatLimsEntity } from "../utils/format.util";
import TestGroupItem from "../models/test-group-item.model";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import TestGroup from "../models/test-group.model";
import { Transaction } from "sequelize";

export const createTestGroupRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await TestGroup.create(data, { transaction }));
};

export const updateTestGroupRepo = async (id: string, data: any, transaction?: Transaction) => {
  await TestGroup.update(data, { where: { id }, transaction });
  return await getTestGroupByIdRepo(id, transaction);
};

export const getTestGroupByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await TestGroup.findOne({ where: { id, isDeleted: false },
    include: [
      { model: TestGroupItem, as: "items", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }], transaction }));
};

export const getAllTestGroupsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await TestGroup.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(TestGroup, filters) },
    include: [
      { model: TestGroupItem, as: "items", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteTestGroupRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await TestGroup.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
