import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A reusable Parameter definition (name, type, default, unit). Stock and
 * Stock Batch attach values for these through their own sub-form tables.
 */
export interface IParameter {
  id?: string;
  parameterId: string;
  parameterName: string;
  parameterTypeId?: string | null;
  defaultValue?: string | null;
  unit?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Parameter extends Model<IParameter> implements IParameter {
  public id!: string;
  public parameterId!: string;
  public parameterName!: string;
  public parameterTypeId!: string | null;
  public defaultValue!: string | null;
  public unit!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Parameter.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    parameterId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "parameter_id" },
    parameterName: { type: DataTypes.STRING(200), allowNull: false, field: "parameter_name" },
    parameterTypeId: { type: DataTypes.UUID, allowNull: true, field: "parameter_type_id" },
    defaultValue: { type: DataTypes.STRING(255), allowNull: true, field: "default_value" },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_parameters", underscored: true, timestamps: true }
);

export default Parameter;
