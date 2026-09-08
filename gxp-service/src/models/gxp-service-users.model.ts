import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IGxpUser {
  id: string;
  authUserId: string;
  userName: string;
  userType: "User" | "Resolver";
  roles: string[];
  description?: string;
  createdBy?: string;
  modifiedBy?: string;
  status: "enabled" | "disabled";
  trainingCompleted: boolean;
}

export class GxpUser extends Model<IGxpUser> implements IGxpUser {
  public id!: string;
  public authUserId!: string;
  public userName!: string;
  public userType!: "User" | "Resolver";
  public roles!: string[];
  public description!: string;
  public createdBy!: string;
  public modifiedBy!: string;
  public status!: "enabled" | "disabled";
  public trainingCompleted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GxpUser.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    authUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "auth_user_id"
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_name"
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_type"
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: []
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    trainingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "training_completed"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "gxp_users",
    underscored: true,
    timestamps: true
  }
);
export default GxpUser;
