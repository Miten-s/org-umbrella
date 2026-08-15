import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One test row inside a Test Group.
 */
export interface ITestGroupItem {
  id?: string;
  testGroupId: string;
  testName?: string | null;
  instrumentCategory?: string | null;
  instrumentType?: string | null;
  instrumentId?: string | null;
  replicateCount?: number | null;
  sortOrder?: number | null;
}

export class TestGroupItem extends Model<ITestGroupItem> implements ITestGroupItem {
  public id!: string;
  public testGroupId!: string;
  public testName!: string | null;
  public instrumentCategory!: string | null;
  public instrumentType!: string | null;
  public instrumentId!: string | null;
  public replicateCount!: number | null;
  public sortOrder!: number | null;
}

TestGroupItem.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    testGroupId: { type: DataTypes.UUID, allowNull: false, field: "test_group_id" },
    testName: { type: DataTypes.STRING(200), allowNull: true, field: "test_name" },
    instrumentCategory: { type: DataTypes.STRING(150), allowNull: true, field: "instrument_category" },
    instrumentType: { type: DataTypes.STRING(150), allowNull: true, field: "instrument_type" },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    replicateCount: { type: DataTypes.INTEGER, allowNull: true, field: "replicate_count" },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  { sequelize, tableName: "lims_test_group_items", underscored: true, timestamps: true }
);

export default TestGroupItem;
