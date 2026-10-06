import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** Which groups a gxp user may reach beyond their home group — mirrors lims-service's
 * UserAccessGroup. Expanded down the group hierarchy, this is the basis of what data a
 * gxp user can see once domain entities are scoped by group_id. */
export interface IUserAccessGroup {
  id?: string;
  gxpUserId: string;
  groupId: string;
}

export class UserAccessGroup
  extends Model<IUserAccessGroup>
  implements IUserAccessGroup
{
  public id!: string;
  public gxpUserId!: string;
  public groupId!: string;
}

UserAccessGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    gxpUserId: { type: DataTypes.UUID, allowNull: false, field: "gxp_user_id" },
    groupId: { type: DataTypes.UUID, allowNull: false, field: "group_id" }
  },
  {
    sequelize,
    tableName: "gxp_user_access_groups",
    underscored: true,
    timestamps: true
  }
);

export default UserAccessGroup;
