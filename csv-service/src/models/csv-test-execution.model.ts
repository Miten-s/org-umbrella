import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import CsvEvidence from "./csv-evidence.model";

export class CsvTestExecution extends Model {
  public id!: string;
  public stepId!: string;
  public actualResult!: string;
  public status!: string;
  public executedBy!: string;
  public executedAt!: Date;
  public evidences?: CsvEvidence[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvTestExecution.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    stepId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "step_id"
    },
    actualResult: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "actual_result"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "NOT_RUN"
    },
    executedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "executed_by"
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "executed_at"
    }
  },
  {
    sequelize,
    tableName: "csv_test_executions",
    underscored: true
  }
);

export default CsvTestExecution;
