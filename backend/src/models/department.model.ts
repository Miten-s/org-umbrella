import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Location } from "./location.model";

export interface IDepartment {
  id: string;
  departmentName: string;
  departmentManagerId: string;
  departmentGroupLocationId: string;
  description?: string;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
  status: "active" | "disabled";
  deletedAt?: Date | null;
}

export class Department extends Model<IDepartment> implements IDepartment {
  public id!: string;
  public departmentName!: string;
  public departmentManagerId!: string;
  public departmentGroupLocationId!: string;
  public description!: string;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public status!: "active" | "disabled";
  public deletedAt!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "department_name"
    },
    departmentManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "department_manager_id"
    },
    departmentGroupLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "department_group_location_id",
      references: {
        model: "locations",
        key: "id"
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
      type: DataTypes.STRING,
      allowNull: true,
      field: "modified_by"
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
    }
  },
  {
    sequelize,
    tableName: "departments",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);

// Department Belongs To Location
Department.belongsTo(Location, {
  foreignKey: "department_group_location_id",
  as: "location"
});

export default Department;
