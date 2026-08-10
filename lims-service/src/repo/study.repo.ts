import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import LimsUser from "../models/lims-user.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Study from "../models/study.model";
import Project from "../models/project.model";
import { Transaction } from "sequelize";

export const createStudyRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Study.create(data, { transaction }));
};

export const updateStudyRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Study.update(data, { where: { id }, transaction });
  return await getStudyByIdRepo(id, transaction);
};

export const getStudyByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Study.findOne({ 
    where: { id, isDeleted: false },
    include: [
      { model: LimsUser, as: "supervisor", attributes: ["id", "userName"] },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Project, as: "project", attributes: ["id", "name"] }],
    transaction 
  }));
};

export const getAllStudiesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Study.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Study, filters) },
    include: [
      { model: LimsUser, as: "supervisor", attributes: ["id", "userName"] },
      { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Project, as: "project", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [[sortBy, sortDir]]
  }));
};

export const deleteStudyRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Study.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
