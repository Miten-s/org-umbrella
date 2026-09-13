import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvFunctionalRisk extends Model {
  public id!: string;
  public fsId!: string;
  public hazardMode!: string;
  public severity!: string;
  public probability!: string;
  public residualRisk!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvFunctionalRisk.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fsId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "fs_id"
    },
    hazardMode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "hazard_mode"
    },
    severity: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    probability: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    residualRisk: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "residual_risk"
    }
  },
  {
    sequelize,
    tableName: "csv_functional_risks",
    underscored: true
  }
);

export default CsvFunctionalRisk;
