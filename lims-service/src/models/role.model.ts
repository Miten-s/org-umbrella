import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** A Lab Role — GLOBAL, one "Analyst" row assignable to anyone. `groupId` records who may
 * edit the definition, and is NOT an access scope. */
export interface IRole {
  id?: string;
  roleId: string;
  name: string;
  description?: string | null;
  groupId?: string | null;
  /** Grants OPERATE:ALL — bypasses group filtering entirely. */
  operateAll?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Role extends Model<IRole> implements IRole {
  public id!: string;
  public roleId!: string;
  public name!: string;
  public description!: string | null;
  public groupId!: string | null;
  public operateAll!: boolean;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Role.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    roleId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "role_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    operateAll: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "operate_all"
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
  { sequelize, tableName: "lims_roles", underscored: true, timestamps: true }
);

export default Role;
