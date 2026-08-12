import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * Grants an existing platform user access to LIMS. LIMS never creates users —
 * `userId` points at a row in the separate auth database, which is why it is a
 * plain string and not a foreign key.
 *
 * No lims_users row means no LIMS access at all, however valid the JWT is.
 */
export interface ILimsUser {
  id?: string;
  /** Platform (auth-service) user id from the JWT `sub`/`id` claim. */
  userId: string;
  userName?: string | null;
  /** Home group — the default stamped on records this user creates. */
  groupId?: string | null;
  locationId?: string | null;
  signature?: string | null;
  description?: string | null;
  trainingCompleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class LimsUser extends Model<ILimsUser> implements ILimsUser {
  public id!: string;
  public userId!: string;
  public userName!: string | null;
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
    userId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "user_id" },
    userName: { type: DataTypes.STRING(200), allowNull: true, field: "user_name" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    signature: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    trainingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "training_completed"
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted"
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_users", underscored: true, timestamps: true }
);

export default LimsUser;
