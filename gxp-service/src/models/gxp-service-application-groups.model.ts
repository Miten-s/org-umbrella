import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppGroup {
  id: string;
  applicationId: string;
  appGroup: string;
  active: boolean;
  createdBy?: string;
}

export class AppGroup extends Model<IAppGroup> implements IAppGroup {
  public id!: string;
  public applicationId!: string;
  public appGroup!: string;
  public active!: boolean;
  public createdBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppGroup.init(
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
    appGroup: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "app_group"
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    }
  },
  {
    sequelize,
    tableName: "app_groups",
    underscored: true,
    timestamps: true
  }
);
export default AppGroup;
