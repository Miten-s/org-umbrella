import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IDesignation {
  id: string;
  designationName: string;
  description?: string;
  status: "active" | "disabled";
  deletedAt?: Date | null;
  modifiedOn?: Date;
  modifiedBy?: string;
}

export class Designation extends Model<IDesignation> implements IDesignation {
  public id!: string;
  public designationName!: string;
  public description!: string;
  public status!: "active" | "disabled";
  public deletedAt!: Date | null;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Designation.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    designationName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "designation_name"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "designations",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);
export default Designation;
