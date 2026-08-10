import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppService {
  id: string;
  service: string;
  active: boolean;
}

export class AppService extends Model<IAppService> implements IAppService {
  public id!: string;
  public service!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppService.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: "app_services",
    underscored: true,
    timestamps: true
  }
);
export default AppService;
