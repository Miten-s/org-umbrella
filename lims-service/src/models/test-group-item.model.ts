import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One Test Template (Analysis) inside a Test Group. The instrument and replicates are
 * decided by the method and at execution time, never by the group.
 */
export interface ITestGroupItem {
  id?: string;
  testGroupId: string;
  analysisId: string;
  sortOrder?: number | null;
}

export class TestGroupItem
  extends Model<ITestGroupItem>
  implements ITestGroupItem
{
  public id!: string;
  public testGroupId!: string;
  public analysisId!: string;
  public sortOrder!: number | null;
}

TestGroupItem.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    testGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "test_group_id"
    },
    analysisId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "analysis_id"
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  {
    sequelize,
    tableName: "lims_test_group_items",
    underscored: true,
    timestamps: true
  }
);

export default TestGroupItem;
