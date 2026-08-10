import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import Customer from "../models/customer.model";
import { Transaction } from "sequelize";

export const createCustomerRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Customer.create(data, { transaction }));
};

export const updateCustomerRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Customer.update(data, { where: { id }, transaction });
  return await getCustomerByIdRepo(id, transaction);
};

export const getCustomerByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Customer.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }], transaction }));
};

export const getAllCustomersRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Customer.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Customer, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteCustomerRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Customer.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
