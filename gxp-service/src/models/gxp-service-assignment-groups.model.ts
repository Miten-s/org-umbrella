import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { GxpUser } from "./gxp-service-users.model";

export interface IAssignmentGroup {
  id: string;
  groupName: string;
  managerUserId: string;
  managerName: string;
  description?: string;
  createdOn?: Date;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
  isActive: boolean;
}

export class AssignmentGroup extends Model<IAssignmentGroup> implements IAssignmentGroup {
  public id!: string;
  public groupName!: string;
  public managerUserId!: string;
  public managerName!: string;
  public description!: string;
  public createdOn!: Date;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public isActive!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public members?: GxpUser[];
}

AssignmentGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "group_name"
    },
    managerUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "manager_user_id"
    },
    managerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "manager_name"
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_on"
    },
    createdBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "created_by"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "assignment_groups",
    underscored: true,
    timestamps: true
  }
);

// Join model for group members to cache user names
export class AssignmentGroupMember extends Model {}
AssignmentGroupMember.init(
  {
    groupId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: "group_id",
      references: { model: "assignment_groups", key: "id" }
    },
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: "user_id",
      references: { model: "gxp_users", key: "id" }
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_name"
    }
  },
  {
    sequelize,
    tableName: "assignment_group_members",
    underscored: true,
    timestamps: false
  }
);

// Associations
AssignmentGroup.belongsToMany(GxpUser, {
  through: AssignmentGroupMember,
  foreignKey: "group_id",
  otherKey: "user_id",
  as: "members"
});

GxpUser.belongsToMany(AssignmentGroup, {
  through: AssignmentGroupMember,
  foreignKey: "user_id",
  otherKey: "group_id",
  as: "assignmentGroups"
});

export default AssignmentGroup;
