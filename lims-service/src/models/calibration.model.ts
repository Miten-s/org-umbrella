import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Instrument from "./instrument.model";
import CalibrationSchedule from "./calibration-schedule.model";

export interface ICalibration {
  id?: string;
  scheduleId?: string | null;
  instrumentId: string;
  performedBy?: string | null;
  performedAt: Date;
  resultPhraseId: string;
  notes?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Calibration extends Model<ICalibration> implements ICalibration {
  public id!: string;

public scheduleId!: string | null;
  public instrumentId!: string;
  public performedBy!: string | null;
  public performedAt!: Date;
  public resultPhraseId!: string;
  public notes!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Calibration.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    scheduleId: { type: DataTypes.UUID, allowNull: true, field: "schedule_id" },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    performedBy: { type: DataTypes.UUID, allowNull: true, field: "performed_by" },
    performedAt: { type: DataTypes.DATE, allowNull: false, field: "performed_at" },
    resultPhraseId: { type: DataTypes.UUID, allowNull: false, field: "result_phrase_id" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_calibrations",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Instrument.hasMany(Calibration, { foreignKey: "instrument_id", as: "calibrations" });
Calibration.belongsTo(Instrument, { foreignKey: "instrument_id", as: "instrument" });

CalibrationSchedule.hasMany(Calibration, { foreignKey: "schedule_id", as: "calibrations" });
Calibration.belongsTo(CalibrationSchedule, { foreignKey: "schedule_id", as: "schedule" });

// ─── Auto-generated associations ───
Calibration.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Calibration.belongsTo(PhraseEntry, { foreignKey: "result_phrase_id", targetKey: "id", as: "resultPhrase" });

export default Calibration;
