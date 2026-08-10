import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ILimsUser {
  id?: string;
  userId: string;
  userName: string;
  groupId?: string | null;
  locationId?: string | null;
  signature?: string | null;
  description?: string | null;
  trainingCompleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class LimsUser extends Model<ILimsUser> implements ILimsUser {
  public id!: string;
  public userId!: string;
  public userName!: string;
  public groupId!: string | null;
  public locationId!: string | null;
  public signature!: string | null;
  public description!: string | null;
  public trainingCompleted!: boolean;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

LimsUser.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "user_id" },
    userName: { type: DataTypes.STRING(200), allowNull: false, field: "user_name" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    signature: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    trainingCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "training_completed" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_users",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

// ─── Join: LimsUser ↔ Roles ─────────────────────────────────────────────────
export class LimsUserRole extends Model {
  public limsUserId!: string;
  public roleId!: string;
}

LimsUserRole.init(
  {
    limsUserId: { type: DataTypes.UUID, allowNull: false, field: "lims_user_id" },
    roleId: { type: DataTypes.UUID, allowNull: false, field: "role_id" }
  },
  {
    sequelize,
    tableName: "lims_user_roles",
    underscored: true,
    timestamps: false
  }
);

// ─── Join: LimsUser ↔ Access Groups ─────────────────────────────────────────
export class LimsUserAccessGroup extends Model {
  public limsUserId!: string;
  public groupId!: string;
}

LimsUserAccessGroup.init(
  {
    limsUserId: { type: DataTypes.UUID, allowNull: false, field: "lims_user_id" },
    groupId: { type: DataTypes.UUID, allowNull: false, field: "group_id" }
  },
  {
    sequelize,
    tableName: "lims_user_access_groups",
    underscored: true,
    timestamps: false
  }
);

export default LimsUser;
