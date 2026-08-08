import Specification from "../models/specification.model";
import { Transaction } from "sequelize";

export const createSpecificationRepo = async (data: any, transaction?: Transaction) => {
  return await Specification.create(data, { transaction });
};

export const updateSpecificationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Specification.update(data, { where: { id }, transaction });
  return await getSpecificationByIdRepo(id, transaction);
};

export const getSpecificationByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Specification.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllSpecificationsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Specification.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteSpecificationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Specification.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
