import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppRole {
  id: string;
  role: string;
  active: boolean;
}

export class AppRole extends Model<IAppRole> implements IAppRole {
  public id!: string;
  public role!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppRole.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    role: {
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
    tableName: "app_roles",
    underscored: true,
    timestamps: true
  }
);
export default AppRole;
