import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvRtmMatrix extends Model {
  public id!: string;
  public projectId!: string;
  public ursId!: string;
  public fsId!: string | null;
  public riskId!: string | null;
  public testCaseId!: string | null;
  public coverageStatus!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvRtmMatrix.init(
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
    ursId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "urs_id"
    },
    fsId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "fs_id"
    },
    riskId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "risk_id"
    },
    testCaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "test_case_id"
    },
    coverageStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "UNCOVERED",
      field: "coverage_status"
    }
  },
  {
    sequelize,
    tableName: "csv_rtm_matrix",
    underscored: true
  }
);

export default CsvRtmMatrix;
