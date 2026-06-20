import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppDepartment {
  id: string;
  applicationId: string;
  departmentName: string;
  active: boolean;
}

export class AppDepartment extends Model<IAppDepartment> implements IAppDepartment {
  public id!: string;
  public applicationId!: string;
  public departmentName!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppDepartment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "application_id"
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "department_name"
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: "app_departments",
    underscored: true,
    timestamps: true
  }
);
export default AppDepartment;
