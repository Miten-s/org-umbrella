import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvVsrReport extends Model {
  public id!: string;
  public projectId!: string;
  public summaryText!: string;
  public releaseRecommendation!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvVsrReport.init(
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
    summaryText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "summary_text"
    },
    releaseRecommendation: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "release_recommendation"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    }
  },
  {
    sequelize,
    tableName: "csv_vsr_reports",
    underscored: true
  }
);

export default CsvVsrReport;
