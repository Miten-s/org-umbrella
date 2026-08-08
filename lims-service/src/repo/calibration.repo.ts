import Calibration from "../models/calibration.model";
import Instrument from "../models/instrument.model";
import CalibrationSchedule from "../models/calibration-schedule.model";
import { Transaction } from "sequelize";

export const createCalibrationRepo = async (data: any, transaction?: Transaction) => {
  return await Calibration.create(data, { transaction });
};

export const updateCalibrationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Calibration.update(data, { where: { id }, transaction });
  return await getCalibrationByIdRepo(id, transaction);
};

export const getCalibrationByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Calibration.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: Instrument, as: "instrument" },
      { model: CalibrationSchedule, as: "schedule" }
    ],
    transaction 
  });
};

export const getAllCalibrationsRepo = async (skip: number, limit: number, filters: any = {}) => {
  return await Calibration.findAndCountAll({
    where: { isDeleted: false, ...filters },
    include: [
      { model: Instrument, as: "instrument" },
      { model: CalibrationSchedule, as: "schedule" }
    ],
    offset: skip,
    limit,
    order: [["performedAt", "DESC"]]
  });
};

export const deleteCalibrationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Calibration.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
