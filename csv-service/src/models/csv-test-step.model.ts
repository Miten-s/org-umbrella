import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvTestStep extends Model {
  public id!: string;
  public testCaseId!: string;
  public stepNum!: number;
  public action!: string;
  public expectedResult!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvTestStep.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    testCaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "test_case_id"
    },
    stepNum: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "step_num"
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expectedResult: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "expected_result"
    }
  },
  {
    sequelize,
    tableName: "csv_test_steps",
    underscored: true
  }
);

export default CsvTestStep;
