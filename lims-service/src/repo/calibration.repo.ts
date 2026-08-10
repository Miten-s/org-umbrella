import { formatLimsEntity } from "../utils/format.util";
import { getSafeFilters } from "../utils/query.util";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Calibration from "../models/calibration.model";
import Instrument from "../models/instrument.model";
import CalibrationSchedule from "../models/calibration-schedule.model";
import { Transaction } from "sequelize";

export const createCalibrationRepo = async (data: any, transaction?: Transaction) => {
  return formatLimsEntity(await Calibration.create(data, { transaction }));
};

export const updateCalibrationRepo = async (id: string, data: any, transaction?: Transaction) => {
  await Calibration.update(data, { where: { id }, transaction });
  return await getCalibrationByIdRepo(id, transaction);
};

export const getCalibrationByIdRepo = async (id: string, transaction?: Transaction, includeRemoved = false) => {
  return formatLimsEntity(await Calibration.findOne({ 
    where: { id, isDeleted: false }, 
    include: [
      { model: CalibrationSchedule, as: "schedule", required: false },
      { model: PhraseEntry, as: "resultPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" },
      { model: CalibrationSchedule, as: "schedule" }
    ],
    transaction 
  }));
};

export const getAllCalibrationsRepo = async (skip: number, limit: number, filters: any = {}, includeRemoved = false, sortBy = "createdAt", sortDir: "ASC" | "DESC" = "DESC") => {
  return formatLimsEntity(await Calibration.findAndCountAll({
    where: { ...(includeRemoved ? {} : { isDeleted: false }), ...getSafeFilters(Calibration, filters) },
    include: [
      { model: CalibrationSchedule, as: "schedule", required: false },
      { model: PhraseEntry, as: "resultPhrase", attributes: ["id", "phraseId", "entryKey", "entryValue"] },
      { model: Group, as: "group", attributes: ["id", "name"] },
      { model: Instrument, as: "instrument" },
      { model: CalibrationSchedule, as: "schedule" }
    ],
    offset: skip,
    limit,
    order: [["performedAt", "DESC"]]
  }));
};

export const deleteCalibrationRepo = async (id: string, deletedBy: string, transaction?: Transaction) => {
  return await Calibration.update(
    { isDeleted: true, deletedBy, deletedAt: new Date() },
    { where: { id }, transaction }
  );
};
