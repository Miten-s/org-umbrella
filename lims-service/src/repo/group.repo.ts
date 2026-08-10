import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import { Transaction } from "sequelize";

export const createGroupRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Group.create(data, { transaction }));
};

export const updateGroupRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Group.update(data, { where: { id }, transaction });
  return await getGroupByIdRepo(id, transaction);
};

export const getGroupByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Group.findOne({ where: { id, isDeleted: false }, transaction }));
};

export const getAllGroupsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Group.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Group, filters) },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteGroupRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Group.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
