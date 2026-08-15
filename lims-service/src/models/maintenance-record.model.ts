import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A maintenance row. Belongs to exactly one of instrument / instrument part —
 * enforced by a CHECK constraint, see migration 007.
 */
export interface IMaintenanceRecord {
  id?: string;
  instrumentId?: string | null;
  instrumentPartId?: string | null;
  maintenanceName?: string | null;
  performedOn?: Date | string | null;
  performedBy?: string | null;
  remarks?: string | null;
}

export class MaintenanceRecord extends Model<IMaintenanceRecord> implements IMaintenanceRecord {
  public id!: string;
  public instrumentId!: string | null;
  public instrumentPartId!: string | null;
  public maintenanceName!: string | null;
  public performedOn!: Date | string | null;
  public performedBy!: string | null;
  public remarks!: string | null;
}

MaintenanceRecord.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    instrumentPartId: { type: DataTypes.UUID, allowNull: true, field: "instrument_part_id" },
    maintenanceName: { type: DataTypes.STRING(200), allowNull: true, field: "maintenance_name" },
    performedOn: { type: DataTypes.DATE, allowNull: true, field: "performed_on" },
    performedBy: { type: DataTypes.STRING(200), allowNull: true, field: "performed_by" },
    remarks: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: "lims_maintenance_records", underscored: true, timestamps: true }
);

export default MaintenanceRecord;
