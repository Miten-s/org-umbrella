import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import TestGroup from "./test-group.model";
import Analysis from "./analysis.model";

export interface ITestGroupItem {
  id?: string;
  testGroupId: string;
  analysisId: string;
  sortOrder: number;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class TestGroupItem extends Model<ITestGroupItem> implements ITestGroupItem {
  public id!: string;

public testGroupId!: string;
  public analysisId!: string;
  public sortOrder!: number;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

TestGroupItem.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    testGroupId: { type: DataTypes.UUID, allowNull: false, field: "test_group_id" },
    analysisId: { type: DataTypes.UUID, allowNull: false, field: "analysis_id" },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: "sort_order" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_test_group_items",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

TestGroup.belongsToMany(Analysis, { through: TestGroupItem, foreignKey: "test_group_id", otherKey: "analysis_id", as: "analyses" });
Analysis.belongsToMany(TestGroup, { through: TestGroupItem, foreignKey: "analysis_id", otherKey: "test_group_id", as: "testGroups" });

TestGroup.hasMany(TestGroupItem, { foreignKey: "test_group_id", as: "items" });
TestGroupItem.belongsTo(TestGroup, { foreignKey: "test_group_id", as: "testGroup" });

Analysis.hasMany(TestGroupItem, { foreignKey: "analysis_id", as: "groupItems" });
TestGroupItem.belongsTo(Analysis, { foreignKey: "analysis_id", as: "analysis" });

// ─── Auto-generated associations ───
TestGroupItem.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });

export default TestGroupItem;
