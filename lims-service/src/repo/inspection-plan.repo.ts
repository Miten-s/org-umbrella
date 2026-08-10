import { formatLimsEntity } from "../utils/format.util";
import InspectionPersonnel from "../models/inspection-personnel.model";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import InspectionPlan from "../models/inspection-plan.model";
import { Transaction } from "sequelize";

export const createInspectionPlanRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await InspectionPlan.create(data, { transaction }));
};

export const updateInspectionPlanRepo = async (id: string, data: any, transaction?: Transaction) => {
  await InspectionPlan.update(data, { where: { id }, transaction });
  return await getInspectionPlanByIdRepo(id, transaction);
};

export const getInspectionPlanByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await InspectionPlan.findOne({ where: { id, isDeleted: false },
    include: [
      { model: InspectionPersonnel, as: "personnelSteps", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }], transaction }));
};

export const getAllInspectionPlansRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await InspectionPlan.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(InspectionPlan, filters) },
    include: [
      { model: InspectionPersonnel, as: "personnelSteps", required: false },{ model: Group, as: "group", attributes: ["id", "name"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteInspectionPlanRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await InspectionPlan.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
