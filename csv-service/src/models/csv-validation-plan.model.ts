import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvValidationPlan extends Model {
  public id!: string;
  public projectId!: string;
  public deliverables!: string[];
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvValidationPlan.init(
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
    deliverables: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: ["IQ", "OQ", "UAT", "VSR"]
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    }
  },
  {
    sequelize,
    tableName: "csv_validation_plans",
    underscored: true
  }
);

export default CsvValidationPlan;
