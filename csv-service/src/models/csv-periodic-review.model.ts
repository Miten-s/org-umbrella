import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

import CsvProject from "./csv-project.model";

export class CsvPeriodicReview extends Model {
  public id!: string;
  public appId!: string;
  public projectId!: string;
  public scheduledDate!: Date;
  public status!: string;
  public reviewerId!: string | null;
  public project?: CsvProject;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvPeriodicReview.init(
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
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "project_id"
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "scheduled_date"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "SCHEDULED"
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "reviewer_id"
    }
  },
  {
    sequelize,
    tableName: "csv_periodic_reviews",
    underscored: true
  }
);

export default CsvPeriodicReview;
