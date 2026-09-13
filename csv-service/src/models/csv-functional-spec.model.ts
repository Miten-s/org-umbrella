import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvFunctionalSpec extends Model {
  public id!: string;
  public ursId!: string;
  public fsCode!: string;
  public flowDetails!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvFunctionalSpec.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ursId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "urs_id"
    },
    fsCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "fs_code"
    },
    flowDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "flow_details"
    }
  },
  {
    sequelize,
    tableName: "csv_functional_specs",
    underscored: true
  }
);

export default CsvFunctionalSpec;
