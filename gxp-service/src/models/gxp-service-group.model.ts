import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** The access-scoping unit for GXP — mirrors lims-service's Group. Self-referencing:
 * access to a parent group is meant to cascade to its descendants. Not to be confused with
 * `Application.group` (an unrelated, pre-existing field holding a location id) or
 * `AppGroup`/`AssignmentGroup` (per-application metadata tags / ticket-routing groups) —
 * this is the only one of the four that actually restricts which users can see a record. */
export interface IGroup {
  id?: string;
  name: string;
  description?: string | null;
  parentGroupId?: string | null;
  status?: "enabled" | "disabled";
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export class Group extends Model<IGroup> implements IGroup {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public parentGroupId!: string | null;
  public status!: "enabled" | "disabled";
  public createdBy!: string | null;
  public modifiedBy!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING(200), allowNull: true },
    parentGroupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "parent_group_id"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    createdBy: { type: DataTypes.STRING, allowNull: true, field: "created_by" },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "modified_by"
    }
  },
  { sequelize, tableName: "gxp_groups", underscored: true, timestamps: true }
);

export default Group;
