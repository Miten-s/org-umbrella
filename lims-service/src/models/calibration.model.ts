import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Calibration and its schedule — one record, because the spec presents
 * "Calibration and Calibration Schedules" as a single form.
 */
export interface ICalibration {
  id?: string;
  calibrationId: string;
  calibrationName: string;
  instrumentId: string;
  calibrationTypeId?: string | null;
  statusId?: string | null;
  plan?: string | null;
  planTime?: string | null;
  leadTimeValue?: number | null;
  leadTimeUnit?: string | null;
  ownerId?: string | null;
  contractor?: string | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  autoLogin: boolean;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Calibration extends Model<ICalibration> implements ICalibration {
  public id!: string;
  public calibrationId!: string;
  public calibrationName!: string;
  public instrumentId!: string;
  public calibrationTypeId!: string | null;
  public statusId!: string | null;
  public plan!: string | null;
  public planTime!: string | null;
  public leadTimeValue!: number | null;
  public leadTimeUnit!: string | null;
  public ownerId!: string | null;
  public contractor!: string | null;
  public lastMaintenanceDate!: string | null;
  public nextMaintenanceDate!: string | null;
  public autoLogin!: boolean;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Calibration.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    calibrationId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "calibration_id" },
    calibrationName: { type: DataTypes.STRING(200), allowNull: false, field: "calibration_name" },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    calibrationTypeId: { type: DataTypes.UUID, allowNull: true, field: "calibration_type_id" },
    statusId: { type: DataTypes.UUID, allowNull: true, field: "status_id" },
    plan: { type: DataTypes.STRING(50), allowNull: true },
    planTime: { type: DataTypes.STRING(20), allowNull: true, field: "plan_time" },
    leadTimeValue: { type: DataTypes.INTEGER, allowNull: true, field: "lead_time_value" },
    leadTimeUnit: { type: DataTypes.STRING(20), allowNull: true, field: "lead_time_unit" },
    ownerId: { type: DataTypes.UUID, allowNull: true, field: "owner_id" },
    contractor: { type: DataTypes.STRING(200), allowNull: true },
    lastMaintenanceDate: { type: DataTypes.DATEONLY, allowNull: true, field: "last_maintenance_date" },
    nextMaintenanceDate: { type: DataTypes.DATEONLY, allowNull: true, field: "next_maintenance_date" },
    autoLogin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "auto_login" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_calibrations", underscored: true, timestamps: true }
);

export default Calibration;
