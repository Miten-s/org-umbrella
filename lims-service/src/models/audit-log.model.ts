import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";

export interface IAuditLog {
  id?: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  changeReason?: string | null;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
}

export class AuditLog extends Model<IAuditLog> implements IAuditLog {
  public id!: string;
  public entityName!: string;
  public entityId!: string;
  public action!: AuditAction;
  public oldValue!: Record<string, any> | null;
  public newValue!: Record<string, any> | null;
  public changeReason!: string | null;
  public performedBy!: string;
  public performedByName!: string;
  public performedAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    entityName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "entity_name"
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "entity_id"
    },
    action: {
      type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE", "RESTORE"),
      allowNull: false
    },
    oldValue: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "old_value"
    },
    newValue: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "new_value"
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "change_reason"
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "performed_by"
    },
    performedByName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "performed_by_name"
    },
    performedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "performed_at"
    }
  },
  {
    sequelize,
    tableName: "lims_audit_logs",
    underscored: true,
    timestamps: true,
    paranoid: false // Audit logs are immutable and never soft deleted
  }
);

export default AuditLog;
