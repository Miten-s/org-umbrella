import { formatLimsEntity } from "../utils/format.util";
import SpecLimit from "../models/spec-limit.model";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Specification from "../models/specification.model";
import { Transaction } from "sequelize";

export const createSpecificationRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Specification.create(data, { transaction }));
};

export const updateSpecificationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Specification.update(data, { where: { id }, transaction });
  return await getSpecificationByIdRepo(id, transaction);
};

export const getSpecificationByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Specification.findOne({ where: { id, isDeleted: false },
    include: [
      { model: SpecLimit, as: "limits", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllSpecificationsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Specification.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Specification, filters) },
    include: [
      { model: SpecLimit, as: "limits", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "statusPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteSpecificationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Specification.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
