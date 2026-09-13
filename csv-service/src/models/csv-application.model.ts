import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvApplication extends Model {
  public id!: string;
  public appCode!: string;
  public name!: string;
  public gxpClassification!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "app_code"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    gxpClassification: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "GXP",
      field: "gxp_classification"
    }
  },
  {
    sequelize,
    tableName: "csv_applications",
    underscored: true
  }
);

export default CsvApplication;
