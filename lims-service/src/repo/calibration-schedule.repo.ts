import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import Group from "../models/group.model";
import CalibrationSchedule from "../models/calibration-schedule.model";
import Instrument from "../models/instrument.model";
import { Transaction } from "sequelize";

export const createCalibrationScheduleRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await CalibrationSchedule.create(data, { transaction }));
};

export const updateCalibrationScheduleRepo = async (id: string, data: any, transaction?: Transaction) => {
  await CalibrationSchedule.update(data, { where: { id }, transaction });
  return await getCalibrationScheduleByIdRepo(id, transaction);
};

export const getCalibrationScheduleByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await CalibrationSchedule.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" }],
    transaction 
  }));
};

export const getAllCalibrationSchedulesRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await CalibrationSchedule.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(CalibrationSchedule, filters) },
    include: [
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" }],
    offset: skip,
    limit,
    order: [["nextDueDate", "ASC"]]
  }));
};

export const deleteCalibrationScheduleRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await CalibrationSchedule.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
