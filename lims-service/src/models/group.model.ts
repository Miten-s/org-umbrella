import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Lab Group — the tag carried by every LIMS record, and the unit of access.
 * Self-referencing: access to a parent group cascades to all descendants
 * (expandGroupIds() in user-context.service.ts walks this tree).
 */
export interface IGroup {
  id?: string;
  groupId: string;
  name: string;
  description?: string | null;
  ownedBy?: string | null;
  /** Denormalised: the owner lives in the auth database and cannot be joined. */
  ownedByName?: string | null;
  parentGroupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Group extends Model<IGroup> implements IGroup {
  public id!: string;
  public groupId!: string;
  public name!: string;
  public description!: string | null;
  public ownedBy!: string | null;
  public ownedByName!: string | null;
  public parentGroupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Group.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    groupId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "group_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownedBy: { type: DataTypes.STRING(100), allowNull: true, field: "owned_by" },
    ownedByName: { type: DataTypes.STRING(200), allowNull: true, field: "owned_by_name" },
    parentGroupId: { type: DataTypes.UUID, allowNull: true, field: "parent_group_id" },
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
  { sequelize, tableName: "lims_groups", underscored: true, timestamps: true }
);

export default Group;
