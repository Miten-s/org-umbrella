import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import InspectionPersonnel from "../models/inspection-personnel.model";
import InspectionPlan from "../models/inspection-plan.model";
import { Transaction } from "sequelize";

export const createInspectionPersonnelRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await InspectionPersonnel.create(data, { transaction }));
};

export const updateInspectionPersonnelRepo = async (id: string, data: any, transaction?: Transaction) => {
  await InspectionPersonnel.update(data, { where: { id }, transaction });
  return await getInspectionPersonnelByIdRepo(id, transaction);
};

export const getInspectionPersonnelByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await InspectionPersonnel.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: InspectionPlan, as: "plan" }],
    transaction 
  }));
};

export const getAllInspectionPersonnelRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await InspectionPersonnel.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(InspectionPersonnel, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: InspectionPlan, as: "plan" }],
    offset: skip,
    limit,
    order: [["stepOrder", "ASC"]]
  }));
};

export const deleteInspectionPersonnelRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await InspectionPersonnel.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
