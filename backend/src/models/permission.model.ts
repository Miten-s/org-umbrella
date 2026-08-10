import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IPermission {
  id: string;
  name: string;
  description?: string;
  type?: string;
  deletedAt?: Date | null;
}

export class Permission extends Model<IPermission> implements IPermission {
  public id!: string;
  public name!: string;
  public description!: string;
  public type!: string;
  public deletedAt!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "default"
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    }
  },
  {
    sequelize,
    tableName: "permissions",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);
export default Permission;
