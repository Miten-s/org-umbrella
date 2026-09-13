import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvChangeControl extends Model {
  public id!: string;
  public changeCode!: string;
  public title!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvChangeControl.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    changeCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "change_code"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "OPEN"
    }
  },
  {
    sequelize,
    tableName: "csv_change_controls",
    underscored: true
  }
);

export default CsvChangeControl;
