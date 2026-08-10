import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export const ROLE_ENTRY_VALUES = [
  "USER", "ROLE", "GROUP", "PROJECT", "STUDY", "SUPPLIER", "CUSTOMER",
  "LOCATION", "STOCK", "PARAMETER", "STOCK_BATCH", "ALIQUOT",
  "INSTRUMENT", "INSTRUMENT_PART", "CALIBRATION", "INSPECTION_PLAN",
  "ANALYSIS", "TEST_GROUP", "SPECIFICATION", "BATCH",
  "LOT", "SAMPLE", "TEST", "RESULT", "SCHEDULER", "PHRASE"
] as const;

export type RoleEntryValue = typeof ROLE_ENTRY_VALUES[number];

export interface IRole {
  id?: string;
  roleId: string;
  name: string;
  description?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export interface IRoleEntry {
  id?: string;
  roleId: string;
  entry: RoleEntryValue;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canRemove: boolean;
}

export class RoleEntry extends Model<IRoleEntry> implements IRoleEntry {
  public id!: string;
  public roleId!: string;
  public entry!: RoleEntryValue;
  public canView!: boolean;
  public canCreate!: boolean;
  public canEdit!: boolean;
  public canRemove!: boolean;
}

RoleEntry.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "role_id",
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    entry: { type: DataTypes.ENUM(...ROLE_ENTRY_VALUES), allowNull: false },
    canView: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_view" },
    canCreate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_create" },
    canEdit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_edit" },
    canRemove: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_remove" }
  },
  {
    sequelize,
    tableName: "lims_role_entries",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

export class Role extends Model<IRole> implements IRole {
  public id!: string;
  public roleId!: string;
  public name!: string;
  public description!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

  public readonly entries?: RoleEntry[];

}

Role.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    roleId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "role_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_roles",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

// Association
Role.hasMany(RoleEntry, { as: "entries", foreignKey: "roleId" });
RoleEntry.belongsTo(Role, { as: "role", foreignKey: "roleId" });

export default Role;
