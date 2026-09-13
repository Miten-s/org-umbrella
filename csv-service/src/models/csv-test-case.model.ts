import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvTestCase extends Model {
  public id!: string;
  public protocolId!: string;
  public tcCode!: string;
  public title!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvTestCase.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    protocolId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "protocol_id"
    },
    tcCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "tc_code"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "csv_test_cases",
    underscored: true
  }
);

export default CsvTestCase;
