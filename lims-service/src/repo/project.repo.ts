import Project from "../models/project.model";
import Customer from "../models/customer.model";
import { Transaction } from "sequelize";

export const createProjectRepo = async (data: any, transaction?: Transaction) => {
  return await Project.create(data, { transaction });
};

export const updateProjectRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Project.update(data, { where: { id }, transaction });
  return await getProjectByIdRepo(id, transaction);
};

export const getProjectByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Project.findOne({ 
    where: { id, isDeleted: false }, 
    include: [{ model: Customer, as: "customer", attributes: ["id", "name"] }],
    transaction 
  });
};

export const getAllProjectsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Project.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Customer, as: "customer", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteProjectRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Project.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
