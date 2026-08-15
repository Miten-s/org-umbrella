import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One shared audit table for every entity (spec §11: Who/When/New/Old/Why/
 * Unique ID on every create/update/remove/restore). `entityName` + `entityId`
 * is the discriminator instead of one audit table per entity — same data,
 * one migration, one index to maintain.
 */
/**
 * CANCEL/REACTIVATE are execution-only: cancelling a sample is a business
 * outcome, distinct from DELETE/RESTORE which hide and unhide a record.
 */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "CANCEL"
  | "REACTIVATE";

export interface IAuditLog {
  id?: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  /** Per-collection added/removed/changed for nested sub-forms (spec §6). */
  childChanges?: Record<string, any> | null;
  changeReason?: string | null;
  performedBy: string;
  performedByName?: string | null;
  performedAt?: Date;
}

export class AuditLog extends Model<IAuditLog> implements IAuditLog {
  public id!: string;
  public entityName!: string;
  public entityId!: string;
  public action!: AuditAction;
  public oldValue!: Record<string, any> | null;
  public newValue!: Record<string, any> | null;
  public childChanges!: Record<string, any> | null;
  public changeReason!: string | null;
  public performedBy!: string;
  public performedByName!: string | null;
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
      type: DataTypes.STRING(20),
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
    childChanges: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "child_changes"
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "change_reason"
    },
    performedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "performed_by"
    },
    performedByName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "performed_by_name"
    },
    performedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "performed_at"
    }
  },
  {
    sequelize,
    tableName: "lims_audit_logs",
    underscored: true,
    timestamps: false,
    paranoid: false, // Audit logs are immutable and never soft-deleted.
    indexes: [{ fields: ["entity_name", "entity_id"] }]
  }
);

export default AuditLog;
