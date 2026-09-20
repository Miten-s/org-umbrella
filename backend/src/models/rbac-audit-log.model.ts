import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export type RbacAuditAction =
  | "ROLE_CREATE"
  | "ROLE_UPDATE"
  | "ROLE_DELETE"
  | "ROLE_BULK_DELETE"
  | "ROLE_BULK_DUPLICATE"
  | "ROLE_ASSIGN"
  | "PERMISSION_CREATE"
  | "PERMISSION_UPDATE"
  | "PERMISSION_DELETE"
  | "PERMISSION_BULK_DELETE"
  | "PERMISSION_BULK_DUPLICATE";

export type RbacAuditTargetType = "role" | "permission" | "user_role";

export interface IRbacAuditLog {
  id?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: RbacAuditAction;
  targetType: RbacAuditTargetType;
  targetId?: string | null;
  targetName?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
}

export class RbacAuditLog extends Model<IRbacAuditLog> implements IRbacAuditLog {
  public id!: string;
  public actorUserId!: string | null;
  public actorEmail!: string | null;
  public action!: RbacAuditAction;
  public targetType!: RbacAuditTargetType;
  public targetId!: string | null;
  public targetName!: string | null;
  public beforeState!: unknown;
  public afterState!: unknown;
  public reason!: string | null;
  public readonly created_at!: Date;
}

RbacAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    actorUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "actor_user_id"
    },
    actorEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "actor_email"
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "target_type"
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "target_id"
    },
    targetName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "target_name"
    },
    beforeState: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "before_state"
    },
    afterState: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "after_state"
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "rbac_audit_log",
    underscored: true,
    // Append-only: a row records when it happened and is never touched again.
    timestamps: true,
    updatedAt: false,
    createdAt: "created_at"
  }
);

export default RbacAuditLog;
