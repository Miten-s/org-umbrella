import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import LimsUser from "../models/lims-user.model";
import Group from "../models/group.model";
import Scheduler from "../models/scheduler.model";
import { Transaction } from "sequelize";

export const createSchedulerRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Scheduler.create(data, { transaction }));
};

export const updateSchedulerRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Scheduler.update(data, { where: { id }, transaction });
  return await getSchedulerByIdRepo(id, transaction);
};

export const getSchedulerByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Scheduler.findOne({ where: { id, isDeleted: false },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: LimsUser, as: "owner", attributes: ["id", "userId", "userName"] }], transaction }));
};

export const getAllSchedulersRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Scheduler.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Scheduler, filters) },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }, { model: LimsUser, as: "owner", attributes: ["id", "userId", "userName"] }],
    offset: skip,
    limit,
    order: [["name", "ASC"]]
  }));
};

export const deleteSchedulerRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Scheduler.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};

export const getActiveSchedulersDueRepo = async () => {
  const { Op } = await import("sequelize");
  return formatLimsEntity(await Scheduler.findAll({
    where: {
      isActive: true,
      isDeleted: false,
      nextRunDate: { [Op.lte]: new Date() }
    }
  }));
};
