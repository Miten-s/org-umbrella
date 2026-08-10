import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppModule {
  id: string;
  moduleName: string;
  applicationId?: string | null;
  moduleIdString: string;
  status: "enabled" | "disabled";
  createdBy?: string;
}

export class AppModule extends Model<IAppModule> implements IAppModule {
  public id!: string;
  public moduleName!: string;
  public applicationId!: string | null;
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
      // A3: optional — a module created manually from the Software Module screen
      // has no application; it is set only via the gxp-applications create flow.
      allowNull: true,
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
