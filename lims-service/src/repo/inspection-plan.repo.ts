import InspectionPlan from "../models/inspection-plan.model";
import { Transaction } from "sequelize";

export const createInspectionPlanRepo = async (data: any, transaction?: Transaction) => {
  return await InspectionPlan.create(data, { transaction });
};

export const updateInspectionPlanRepo = async (id: string, data: any, transaction?: Transaction) => {
  await InspectionPlan.update(data, { where: { id }, transaction });
  return await getInspectionPlanByIdRepo(id, transaction);
};

export const getInspectionPlanByIdRepo = async (id: string, transaction?: Transaction) => {
  return await InspectionPlan.findOne({ where: { id, isDeleted: false }, transaction });
};

export const getAllInspectionPlansRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await InspectionPlan.findAndCountAll({
    where: { isDeleted: false, ...filters },
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  });
};

export const deleteInspectionPlanRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await InspectionPlan.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
