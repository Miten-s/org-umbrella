import GxpServiceUser from "../models/gxp-service-users.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import crypto from "crypto";

const formatUser = (user: any) => {
  if (!user) return null;
  const json = user.toJSON ? user.toJSON() : { ...user };
  json._id = json.id;

  // Reconstruct user object
  json.user = {
    id: json.authUserId,
    name: json.userName
  };
  return json;
};

export const createUserRepo = async (data: any) => {
  const payload = {
    id: data.id || crypto.randomUUID(),
    authUserId: data.user?.id,
    userName: data.user?.name,
    userType: data.userType,
    roles: data.roles || [],
    description: data.description,
    status: data.status || "enabled",
    trainingCompleted: data.trainingCompleted !== undefined ? data.trainingCompleted : false,
    createdBy: data.createdBy,
    modifiedBy: data.modifiedBy
  };
  const doc = await GxpServiceUser.create(payload);
  return formatUser(doc);
};

export const findAllUsersRepo = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};
  if (search) {
    const sanitizedSearch = `%${search}%`;
    where[Op.or] = [
      { userName: { [Op.iLike]: sanitizedSearch } },
      { description: { [Op.iLike]: sanitizedSearch } }
    ];
  }
  const { count: totalCount, rows: data } = await GxpServiceUser.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatUser),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findUserByIdRepo = async (id: string) => {
  const doc = await GxpServiceUser.findByPk(id);
  return formatUser(doc);
};

export const updateUserRepo = async (id: string, data: any) => {
  const user = await GxpServiceUser.findByPk(id);
  if (!user) return null;

  const payload: any = {
    userType: data.userType,
    roles: data.roles,
    description: data.description,
    status: data.status,
    trainingCompleted: data.trainingCompleted,
    modifiedBy: data.modifiedBy
  };

  if (data.user) {
    payload.authUserId = data.user.id;
    payload.userName = data.user.name;
  }

  // Remove undefined fields
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  await user.update(payload);
  return formatUser(user);
};

export const disableUserRepo = async (id: string) => {
  return await updateUserRepo(id, { status: "disabled" });
};

export const enableUserRepo = async (id: string, comments: any) => {
  return await updateUserRepo(id, { status: "enabled", modifiedBy: comments });
};

export const deleteUserRepo = async (id: string) => {
  const user = await GxpServiceUser.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return formatUser(user);
};

export const bulkDeleteUsersRepo = async (ids: string[]) => {
  return await GxpServiceUser.destroy({
    where: { id: ids }
  });
};
