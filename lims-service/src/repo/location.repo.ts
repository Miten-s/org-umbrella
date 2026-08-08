import Location from "../models/location.model";
import { Transaction } from "sequelize";

export const createLocationRepo = async (data: any, transaction?: Transaction) => {
  return await Location.create(data, { transaction });
};

export const updateLocationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Location.update(data, { where: { id }, transaction });
  return await getLocationByIdRepo(id, transaction);
};

export const getLocationByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Location.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: Location, as: "parent", attributes: ["id", "name"] }],
    transaction 
  });
};

export const getAllLocationsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Location.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Location, as: "parent", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteLocationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  // Cascading deletes manually if desired, but typically we just soft delete the parent
  return await Location.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
