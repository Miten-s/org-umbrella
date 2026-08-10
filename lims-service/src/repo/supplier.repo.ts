import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Supplier from "../models/supplier.model";
import { Transaction } from "sequelize";

export const createSupplierRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Supplier.create(data, { transaction }));
};

export const updateSupplierRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Supplier.update(data, { where: { id }, transaction });
  return await getSupplierByIdRepo(id, transaction);
};

export const getSupplierByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Supplier.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "ratingPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }], transaction }));
};

export const getAllSuppliersRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Supplier.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Supplier, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: PhraseEntry, as: "ratingPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteSupplierRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Supplier.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
