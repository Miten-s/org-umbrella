import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvUserRequirement extends Model {
  public id!: string;
  public projectId!: string;
  public ursCode!: string;
  public title!: string;
  public description!: string;
  public gxpFlag!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvUserRequirement.init(
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
    ursCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "urs_code"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gxpFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "gxp_flag"
    }
  },
  {
    sequelize,
    tableName: "csv_user_requirements",
    underscored: true
  }
);

export default CsvUserRequirement;
