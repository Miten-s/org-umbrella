import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * Which roles a LIMS user holds. Multiple roles UNION their permissions — the
 * user can do anything any of their roles allows.
 */
export interface IUserRole {
  id?: string;
  limsUserId: string;
  roleId: string;
}

export class UserRole extends Model<IUserRole> implements IUserRole {
  public id!: string;
  public limsUserId!: string;
  public roleId!: string;
}

UserRole.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    limsUserId: { type: DataTypes.UUID, allowNull: false, field: "lims_user_id" },
    roleId: { type: DataTypes.UUID, allowNull: false, field: "role_id" }
  },
  { sequelize, tableName: "lims_user_roles", underscored: true, timestamps: true }
);

export default UserRole;
