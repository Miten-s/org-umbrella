import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import LimsUser, { LimsUserRole, LimsUserAccessGroup } from "../models/lims-user.model";
import Role, { RoleEntry } from "../models/role.model";
import Group from "../models/group.model";
import { Transaction } from "sequelize";

const INCLUDES = [
  { model: Role, as: "roles", attributes: ["id", "name", "roleId"], include: [{ model: RoleEntry, as: "entries" }] },
  { model: Group, as: "primaryGroup", attributes: ["id", "name"] },
  { model: Group, as: "accessGroups", attributes: ["id", "name"] }
];

// Set up associations (only called once; models handle static `init`)
LimsUser.belongsToMany(Role, { through: LimsUserRole, as: "roles", foreignKey: "limsUserId", otherKey: "roleId" });
Role.belongsToMany(LimsUser, { through: LimsUserRole, as: "limsUsers", foreignKey: "roleId", otherKey: "limsUserId" });

LimsUser.belongsToMany(Group, { through: LimsUserAccessGroup, as: "accessGroups", foreignKey: "limsUserId", otherKey: "groupId" });
Group.belongsToMany(LimsUser, { through: LimsUserAccessGroup, as: "accessUsers", foreignKey: "groupId", otherKey: "limsUserId" });

LimsUser.belongsTo(Group, { as: "primaryGroup", foreignKey: "groupId" });

export const createLimsUserRepo = async (data: any, roleIds: string[], accessGroupIds: string[], transaction?: Transaction) => {
  const user = await LimsUser.create(data, { transaction });
  if (roleIds?.length) await (user as any).setRoles(roleIds, { transaction });
  if (accessGroupIds?.length) await (user as any).setAccessGroups(accessGroupIds, { transaction });
  return await getLimsUserByIdRepo(user.id, transaction);
};

export const updateLimsUserRepo = async (id: string, data: any, roleIds?: string[], accessGroupIds?: string[], transaction?: Transaction) => {
  await LimsUser.update(data, { where: { id }, transaction });
  const user = await LimsUser.findByPk(id, { transaction });
  if (roleIds !== undefined && user) await (user as any).setRoles(roleIds, { transaction });
  if (accessGroupIds !== undefined && user) await (user as any).setAccessGroups(accessGroupIds, { transaction });
  return await getLimsUserByIdRepo(id, transaction);
};

export const getLimsUserByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await LimsUser.findOne({ where: { id, isDeleted: false }, include: INCLUDES, transaction }));
};

export const getAllLimsUsersRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await LimsUser.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(LimsUser, filters) },
    include: INCLUDES,
    offset: skip,
    limit,
    order: [["userName", "ASC"]]
  }));
};

export const deleteLimsUserRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await LimsUser.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
