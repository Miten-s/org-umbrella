import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** The lab group a Lab Role belongs to. The role itself lives in backend; this keeps the
 * one LIMS-only fact about it, which decides which lab admins can see and assign it. */
export interface IRoleGroup {
  roleId: string;
  groupId: string;
}

export class RoleGroup extends Model<IRoleGroup> implements IRoleGroup {
  public roleId!: string;
  public groupId!: string;
}

RoleGroup.init(
  {
    roleId: { type: DataTypes.UUID, primaryKey: true, field: "role_id" },
    groupId: { type: DataTypes.UUID, allowNull: false, field: "group_id" }
  },
  {
    sequelize,
    tableName: "lims_role_groups",
    underscored: true,
    timestamps: true
  }
);

export default RoleGroup;
