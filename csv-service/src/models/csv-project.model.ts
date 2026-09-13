import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvProject extends Model {
  public id!: string;
  public appId!: string;
  public gxpChangeControlId!: string | null;
  public projectTitle!: string;
  public currentPhase!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvProject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "app_id"
    },
    gxpChangeControlId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "gxp_change_control_id"
    },
    projectTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "project_title"
    },
    currentPhase: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "INTAKE",
      field: "current_phase"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    }
  },
  {
    sequelize,
    tableName: "csv_projects",
    underscored: true
  }
);

export default CsvProject;
