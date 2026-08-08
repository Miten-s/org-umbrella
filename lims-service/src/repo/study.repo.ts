import Study from "../models/study.model";
import Project from "../models/project.model";
import { Transaction } from "sequelize";

export const createStudyRepo = async (data: any, transaction?: Transaction) => {
  return await Study.create(data, { transaction });
};

export const updateStudyRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Study.update(data, { where: { id }, transaction });
  return await getStudyByIdRepo(id, transaction);
};

export const getStudyByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Study.findOne({ 
    where: { id, isDeleted: false },
    include: [{ model: Project, as: "project", attributes: ["id", "name"] }],
    transaction 
  });
};

export const getAllStudiesRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Study.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [{ model: Project, as: "project", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["createdAt", "DESC"]]
  });
};

export const deleteStudyRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Study.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
