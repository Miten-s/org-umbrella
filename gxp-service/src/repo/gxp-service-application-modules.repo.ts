import AppModule, { IAppModule } from "../models/gxp-service-application-modules.model";
import Application from "../models/gxp-service-applications.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatAppModule = (module: any) => {
  if (!module) return null;
  const json = module.toJSON ? module.toJSON() : { ...module };
  json._id = json.id;
  if (json.application) {
    json.application = {
      ...json.application,
      _id: json.application.id
    };
  }
  json.application = json.application || json.applicationId;
  json.moduleId = json.moduleIdString;
  return json;
};

const moduleApplicationPopulate = {
  model: Application,
  as: "application",
  attributes: ["applicationName"]
};

export const createApplicationModule = async (
  payload: Partial<IAppModule>,
  currentUser: string
) => {
  const doc = await AppModule.create({
    ...payload,
    createdBy: currentUser
  } as any);
  
  const reloaded = await AppModule.findByPk(doc.id, {
    include: [moduleApplicationPopulate]
  });
  return formatAppModule(reloaded);
};

export const getApplicationModules = async (
  filter: any = {},
  options?: Partial<PaginationOptions>
) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }

  const search = options?.search;
  if (search) {
    where.moduleName = { [Op.iLike]: `%${search}%` };
  }

  if (!options) {
    const data = await AppModule.findAll({
      where,
      include: [moduleApplicationPopulate]
    });
    return data.map(formatAppModule);
  }

  const { page = 1, limit = 10, skip = 0 } = options;
  const { count: totalCount, rows: data } = await AppModule.findAndCountAll({
    where,
    include: [moduleApplicationPopulate],
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });

  return {
    data: data.map(formatAppModule),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findApplicationModulesById = async (id: string) => {
  const doc = await AppModule.findByPk(id, {
    include: [moduleApplicationPopulate]
  });
  return formatAppModule(doc);
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IAppModule>
) => {
  const doc = await AppModule.findByPk(id);
  if (!doc) return null;
  await doc.update(updates);
  const reloaded = await AppModule.findByPk(id, {
    include: [moduleApplicationPopulate]
  });
  return formatAppModule(reloaded);
};

export const deleteApplcationModule = async (id: string) => {
  const doc = await AppModule.findByPk(id);
  if (!doc) return null;
  await doc.destroy();
  return formatAppModule(doc);
};

export const findApplicationModulesByIds = async (ids: string[]) => {
  const data = await AppModule.findAll({
    where: { id: ids }
  });
  return data.map(formatAppModule);
};

export const findApplicationModulesByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const data = await AppModule.findAll({ where });
  return data.map(formatAppModule);
};

export const bulkDeleteApplicationModules = async (ids: string[], session?: any) => {
  return await AppModule.destroy({
    where: { id: ids }
  });
};
