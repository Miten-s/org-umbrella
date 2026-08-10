import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Role, { RoleEntry } from "../models/role.model";
import { Transaction } from "sequelize";

const INCLUDE_ENTRIES = [{ model: RoleEntry, as: "entries" }];

export const createRoleRepo = async (data: any, entries: any[], transaction?: Transaction) => {
  const role = await Role.create(data, { transaction });
  if (entries?.length) {
    await RoleEntry.bulkCreate(
      entries.map((e: any) => ({ ...e, roleId: role.id })),
      { transaction }
    );
  }
  return await getRoleByIdRepo(role.id, transaction);
};

export const updateRoleRepo = async (id: string, data: any, entries?: any[], transaction?: Transaction) => {
  await Role.update(data, { where: { id }, transaction });
  if (entries !== undefined) {
    await RoleEntry.destroy({ where: { roleId: id }, transaction });
    if (entries.length) {
      await RoleEntry.bulkCreate(
        entries.map((e: any) => ({ ...e, roleId: id })),
        { transaction }
      );
    }
  }
  return await getRoleByIdRepo(id, transaction);
};

export const getRoleByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Role.findOne({ where: { id, isDeleted: false }, include: INCLUDE_ENTRIES, transaction }));
};

export const getAllRolesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Role.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Role, filters) },
    include: INCLUDE_ENTRIES,
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteRoleRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Role.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
