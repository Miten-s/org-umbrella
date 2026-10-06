import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Group } from "./gxp-service-group.model";
import { UserAccessGroup } from "./gxp-service-user-access-group.model";

export interface IGxpUser {
  id: string;
  authUserId: string;
  userName: string;
  userType: "User" | "Resolver";
  roles: string[];
  description?: string;
  createdBy?: string;
  modifiedBy?: string;
  status: "enabled" | "disabled";
  trainingCompleted: boolean;
  /** Home group — the group implicitly stamped on records this user creates. */
  groupId?: string | null;
}

export class GxpUser extends Model<IGxpUser> implements IGxpUser {
  public id!: string;
  public authUserId!: string;
  public userName!: string;
  public userType!: "User" | "Resolver";
  public roles!: string[];
  public description!: string;
  public createdBy!: string;
  public modifiedBy!: string;
  public status!: "enabled" | "disabled";
  public trainingCompleted!: boolean;
  public groupId!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public accessGroups?: Group[];
}

GxpUser.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    authUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "auth_user_id"
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_name"
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_type"
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: []
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    trainingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "training_completed"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "modified_by"
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "group_id"
    }
  },
  {
    sequelize,
    tableName: "gxp_users",
    underscored: true,
    timestamps: true
  }
);

// Home group
GxpUser.belongsTo(Group, { foreignKey: "group_id", as: "homeGroup" });
Group.hasMany(GxpUser, { foreignKey: "group_id", as: "usersWithHomeGroup" });

// Explicit access grants beyond the home group
GxpUser.belongsToMany(Group, {
  through: UserAccessGroup,
  foreignKey: "gxp_user_id",
  otherKey: "group_id",
  as: "accessGroups"
});
Group.belongsToMany(GxpUser, {
  through: UserAccessGroup,
  foreignKey: "group_id",
  otherKey: "gxp_user_id",
  as: "usersWithAccess"
});

// Group hierarchy — access to a parent cascades to descendants (see expandGroupIds()).
Group.belongsTo(Group, { as: "parentGroup", foreignKey: "parent_group_id" });
Group.hasMany(Group, { as: "childGroups", foreignKey: "parent_group_id" });

export default GxpUser;
