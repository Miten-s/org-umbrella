import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import LimsUser from "../models/lims-user.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Project from "../models/project.model";
import Customer from "../models/customer.model";
import { Transaction } from "sequelize";

export const createProjectRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Project.create(data, { transaction }));
};

export const updateProjectRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Project.update(data, { where: { id }, transaction });
  return await getProjectByIdRepo(id, transaction);
};

export const getProjectByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Project.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: LimsUser, as: "supervisor", attributes: ["id", "userName"] },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Customer, as: "customer", attributes: ["id", "name"] }],
    transaction 
  }));
};

export const getAllProjectsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Project.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Project, filters) },
    include: [
      { model: LimsUser, as: "supervisor", attributes: ["id", "userName"] },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Customer, as: "customer", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteProjectRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Project.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
