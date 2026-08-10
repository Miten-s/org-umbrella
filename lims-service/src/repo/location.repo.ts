import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Location from "../models/location.model";
import { Transaction } from "sequelize";

export const createLocationRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Location.create(data, { transaction }));
};

export const updateLocationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Location.update(data, { where: { id }, transaction });
  return await getLocationByIdRepo(id, transaction);
};

export const getLocationByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Location.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: PhraseEntry, as: "locationTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Location, as: "parent", attributes: ["id", "name"] }],
    transaction 
  }));
};

export const getAllLocationsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Location.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Location, filters) },
    include: [
      { model: PhraseEntry, as: "locationTypePhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Location, as: "parent", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteLocationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  // Cascading deletes manually if desired, but typically we just soft delete the parent
  return await Location.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
