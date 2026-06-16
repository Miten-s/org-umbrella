import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppModule {
  id: string;
  moduleName: string;
  applicationId: string;
  moduleIdString: string;
  status: "enabled" | "disabled";
  createdBy?: string;
}

export class AppModule extends Model<IAppModule> implements IAppModule {
  public id!: string;
  public moduleName!: string;
  public applicationId!: string;
  public moduleIdString!: string;
  public status!: "enabled" | "disabled";
  public createdBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppModule.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    moduleName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "module_name"
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "application_id"
    },
    moduleIdString: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "module_id_string" // Stores "moduleName_applicationName"
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "enabled"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    }
  },
  {
    sequelize,
    tableName: "app_modules",
    underscored: true,
    timestamps: true
  }
);
export default AppModule;
