import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvConfigSpec extends Model {
  public id!: string;
  public fsId!: string;
  public configCode!: string;
  public parameters!: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvConfigSpec.init(
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
    configCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "config_code"
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "csv_config_specs",
    underscored: true
  }
);

export default CsvConfigSpec;
