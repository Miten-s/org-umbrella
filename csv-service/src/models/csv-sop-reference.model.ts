import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvSopReference extends Model {
  public id!: string;
  public projectId!: string;
  public sopCode!: string;
  public title!: string;
  public effectiveVersion!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvSopReference.init(
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
    sopCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "sop_code"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    effectiveVersion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "effective_version"
    }
  },
  {
    sequelize,
    tableName: "csv_sop_references",
    underscored: true
  }
);

export default CsvSopReference;
