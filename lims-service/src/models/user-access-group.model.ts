import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * Which groups a LIMS user may reach. This — expanded down the group
 * hierarchy — is the whole basis of what data the user can see.
 */
export interface IUserAccessGroup {
  id?: string;
  limsUserId: string;
  groupId: string;
}

export class UserAccessGroup extends Model<IUserAccessGroup> implements IUserAccessGroup {
  public id!: string;
  public limsUserId!: string;
  public groupId!: string;
}

UserAccessGroup.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    limsUserId: { type: DataTypes.UUID, allowNull: false, field: "lims_user_id" },
    groupId: { type: DataTypes.UUID, allowNull: false, field: "group_id" }
  },
  { sequelize, tableName: "lims_user_access_groups", underscored: true, timestamps: true }
);

export default UserAccessGroup;
