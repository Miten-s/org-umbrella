import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** The SEPARATE audit stream for OPERATE:ALL — kept out of lims_audit_logs so "show me every
 * admin override" is a full read of one small table, not a search through millions of rows. */
export interface IAccessBypassLog {
  id?: string;
  performedBy: string;
  performedByName?: string | null;
  entity: string;
  action: string;
  method: string;
  path: string;
  requestId?: string | null;
  performedAt?: Date;
}

export class AccessBypassLog extends Model<IAccessBypassLog> implements IAccessBypassLog {
  public id!: string;
  public performedBy!: string;
  public performedByName!: string | null;
  public entity!: string;
  public action!: string;
  public method!: string;
  public path!: string;
  public requestId!: string | null;
  public performedAt!: Date;
}

AccessBypassLog.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    performedBy: { type: DataTypes.STRING(100), allowNull: false, field: "performed_by" },
    performedByName: { type: DataTypes.STRING(200), allowNull: true, field: "performed_by_name" },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(20), allowNull: false },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.TEXT, allowNull: false },
    requestId: { type: DataTypes.STRING(100), allowNull: true, field: "request_id" },
    performedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "performed_at"
    }
  },
  {
    sequelize,
    tableName: "lims_access_bypass_logs",
    underscored: true,
    timestamps: false,
    paranoid: false
  }
);

export default AccessBypassLog;
