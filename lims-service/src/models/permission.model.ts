import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** The permission catalogue, read-only to users — mirrored from permissions.ts by
 * seedPermissions() on boot, so the vocabulary always matches what the code enforces. */
export interface IPermission {
  id?: string;
  code: string;
  entity: string | null;
  action: string | null;
  label: string;
}

export class Permission extends Model<IPermission> implements IPermission {
  public id!: string;
  public code!: string;
  public entity!: string | null;
  public action!: string | null;
  public label!: string;
}

Permission.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    entity: { type: DataTypes.STRING(50), allowNull: true },
    action: { type: DataTypes.STRING(20), allowNull: true },
    label: { type: DataTypes.STRING(200), allowNull: false }
  },
  { sequelize, tableName: "lims_permissions", underscored: true, timestamps: true }
);

export default Permission;
