import GxpServiceUser from "../models/gxp-service-users.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatUser = (user: any) => {
  if (!user) return null;
  const json = user.toJSON ? user.toJSON() : { ...user };
  json._id = json.id;
  return json;
};

export const createUserRepo = async (data: any) => {
  const doc = await GxpServiceUser.create(data);
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
  await user.update(data);
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
