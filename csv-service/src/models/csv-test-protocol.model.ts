import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvTestProtocol extends Model {
  public id!: string;
  public projectId!: string;
  public protocolType!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvTestProtocol.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "project_id"
    },
    protocolType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "protocol_type"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    }
  },
  {
    sequelize,
    tableName: "csv_test_protocols",
    underscored: true
  }
);

export default CsvTestProtocol;
