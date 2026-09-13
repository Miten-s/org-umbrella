import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvDiscrepancy extends Model {
  public id!: string;
  public executionId!: string;
  public discCode!: string;
  public bugSeverity!: string;
  public rootCause!: string | null;
  public fixStatus!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvDiscrepancy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    executionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "execution_id"
    },
    discCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "disc_code"
    },
    bugSeverity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "bug_severity"
    },
    rootCause: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "root_cause"
    },
    fixStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "OPEN",
      field: "fix_status"
    }
  },
  {
    sequelize,
    tableName: "csv_discrepancies",
    underscored: true
  }
);

export default CsvDiscrepancy;
