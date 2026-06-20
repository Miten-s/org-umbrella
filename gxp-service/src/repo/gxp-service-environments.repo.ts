import Environment, { IEnvironment } from "../models/gxp-service-environments.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatEnv = (env: any) => {
  if (!env) return null;
  const json = env.toJSON ? env.toJSON() : { ...env };
  json._id = json.id;
  json.isActive = json.status === "enabled";
  return json;
};

export const createEnvironment = async (data: any) => {
  const mapped = { ...data };
  if (mapped.isActive === true) mapped.status = "enabled";
  if (mapped.isActive === false) mapped.status = "disabled";
  const doc = await Environment.create(mapped);
  return formatEnv(doc);
};

export const findAllEnvironments = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};
  if (search) {
    const sanitizedSearch = `%${search}%`;
    where[Op.or] = [
      { environmentName: { [Op.iLike]: sanitizedSearch } },
      { description: { [Op.iLike]: sanitizedSearch } }
    ];
  }
  const { count: totalCount, rows: data } = await Environment.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatEnv),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findEnvironment = async (_id: string) => {
  const doc = await Environment.findByPk(_id);
  return formatEnv(doc);
};

export const updateEnvironment = async (_id: string, data: any) => {
  const env = await Environment.findByPk(_id);
  if (!env) return null;
  const mapped = { ...data };
  if (mapped.isActive === true) mapped.status = "enabled";
  if (mapped.isActive === false) mapped.status = "disabled";
  await env.update(mapped);
  return formatEnv(env);
};

export const disableEnvironment = async (_id: string) => {
  const env = await Environment.findByPk(_id);
  if (!env) return null;
  await env.update({ status: "disabled" });
  return formatEnv(env);
};

export const enableEnvironment = async (_id: string) => {
  const env = await Environment.findByPk(_id);
  if (!env) return null;
  await env.update({ status: "enabled" });
  return formatEnv(env);
};

export const deleteEnvironment = async (environmentId: string) => {
  const env = await Environment.findByPk(environmentId);
  if (!env) return null;
  await env.destroy();
  return formatEnv(env);
};

export const findEnvironmentsByIds = async (ids: string[]) => {
  const data = await Environment.findAll({
    where: { id: ids }
  });
  return data.map(formatEnv);
};

export const findEnvironmentsByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  if (where.environmentName && typeof where.environmentName === "object" && where.environmentName.$regex) {
    // Convert Mongo regex to Op.iRegexp
    where.environmentName = { [Op.iRegexp]: where.environmentName.$regex.source || where.environmentName.$regex };
  }
  const data = await Environment.findAll({ where });
  return data.map(formatEnv);
};

export const bulkDeleteEnvironments = async (ids: string[], session?: any) => {
  return await Environment.destroy({
    where: { id: ids }
  });
};