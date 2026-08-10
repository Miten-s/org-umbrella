import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Instrument from "./instrument.model";

export interface ICalibrationSchedule {
  id?: string;
  instrumentId: string;
  title: string;
  frequencyDays: number;
  nextDueDate: Date;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class CalibrationSchedule extends Model<ICalibrationSchedule> implements ICalibrationSchedule {
  public id!: string;

public instrumentId!: string;
  public title!: string;
  public frequencyDays!: number;
  public nextDueDate!: Date;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

CalibrationSchedule.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    title: { type: DataTypes.STRING(200), allowNull: false },
    frequencyDays: { type: DataTypes.INTEGER, allowNull: false, field: "frequency_days" },
    nextDueDate: { type: DataTypes.DATE, allowNull: false, field: "next_due_date" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_calibration_schedules",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Instrument.hasMany(CalibrationSchedule, { foreignKey: "instrument_id", as: "calibrationSchedules" });
CalibrationSchedule.belongsTo(Instrument, { foreignKey: "instrument_id", as: "instrument" });

// ─── Auto-generated associations ───
CalibrationSchedule.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });

export default CalibrationSchedule;
