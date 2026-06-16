import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IEnvironment {
  id: string;
  environmentName: string;
  description?: string;
  status: "enabled" | "disabled";
  createdOn?: Date;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
}

export class Environment extends Model<IEnvironment> implements IEnvironment {
  public id!: string;
  public environmentName!: string;
  public description!: string;
  public status!: "enabled" | "disabled";
  public createdOn!: Date;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Environment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    environmentName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "environment_name"
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "enabled"
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_on"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "environments",
    underscored: true,
    timestamps: true
  }
);
export default Environment;
