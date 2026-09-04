import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** One row per (role, entity) behind the Role form's Permissions grid — the four booleans
 * map to VIEW/CREATE/UPDATE/DELETE via ACTION_COLUMN. Nested in the Role payload, never its own endpoint. */
export interface IRoleEntry {
  id?: string;
  roleId: string;
  entry: string;
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canRemove?: boolean;
}

export class RoleEntry extends Model<IRoleEntry> implements IRoleEntry {
  public id!: string;
  public roleId!: string;
  public entry!: string;
  public canView!: boolean;
  public canCreate!: boolean;
  public canEdit!: boolean;
  public canRemove!: boolean;
}

RoleEntry.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    roleId: { type: DataTypes.UUID, allowNull: false, field: "role_id" },
    entry: { type: DataTypes.STRING(50), allowNull: false },
    canView: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_view" },
    canCreate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "can_create"
    },
    canEdit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "can_edit" },
    canRemove: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "can_remove"
    }
  },
  { sequelize, tableName: "lims_role_entries", underscored: true, timestamps: true }
);

export default RoleEntry;
