import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvEvidence extends Model {
  public id!: string;
  public executionId!: string;
  public filePath!: string;
  public sha256Hash!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvEvidence.init(
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
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "file_path"
    },
    sha256Hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: "sha256_hash"
    }
  },
  {
    sequelize,
    tableName: "csv_evidences",
    underscored: true
  }
);

export default CsvEvidence;
