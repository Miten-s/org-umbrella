import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ICompany {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export class Company extends Model<ICompany> implements ICompany {
  public id!: string;
  public name!: string;
  public logo!: string;
  public description!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    logo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "companies",
    underscored: true,
    timestamps: true
  }
);
export default Company;
