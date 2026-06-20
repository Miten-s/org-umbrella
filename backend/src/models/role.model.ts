import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Permission } from "./permission.model";

export enum RoleType {
  CUSTOM = "Custom",
  BUILT_IN = "Built_In",
  GXP_SERVICE = "Gxp_Service"
}

export interface IRole {
  id?: string;
  name: string;
  type: RoleType;
  deletedAt?: Date | null;
}

export class Role extends Model<IRole> implements IRole {
  public id!: string;
  public name!: string;
  public type!: RoleType;
  public deletedAt!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public permissions?: Permission[];
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM("Custom", "Built_In", "Gxp_Service"),
      allowNull: false,
      defaultValue: "Custom"
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    }
  },
  {
    sequelize,
    tableName: "roles",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);

export class RolePermission extends Model {}
RolePermission.init({
  role_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  permission_id: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "role_permissions",
  timestamps: false,
  underscored: true
});

// Many-to-Many relationship with Permission
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "role_id",
  otherKey: "permission_id",
  as: "permissions"
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permission_id",
  otherKey: "role_id",
  as: "roles"
});


export default Role;
