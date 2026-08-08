import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Specification from "./specification.model";
import AnalysisComponent from "./analysis-component.model";

export interface ISpecLimit {
  id?: string;
  specificationId: string;
  analysisComponentId: string;
  minValue?: number | null;
  maxValue?: number | null;
  targetText?: string | null;
  targetBoolean?: boolean | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SpecLimit extends Model<ISpecLimit> implements ISpecLimit {
  public id!: string;
  public specificationId!: string;
  public analysisComponentId!: string;
  public minValue!: number | null;
  public maxValue!: number | null;
  public targetText!: string | null;
  public targetBoolean!: boolean | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

SpecLimit.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    specificationId: { type: DataTypes.UUID, allowNull: false, field: "specification_id" },
    analysisComponentId: { type: DataTypes.UUID, allowNull: false, field: "analysis_component_id" },
    minValue: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "min_value" },
    maxValue: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "max_value" },
    targetText: { type: DataTypes.STRING(255), allowNull: true, field: "target_text" },
    targetBoolean: { type: DataTypes.BOOLEAN, allowNull: true, field: "target_boolean" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_spec_limits",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Specification.hasMany(SpecLimit, { foreignKey: "specification_id", as: "limits" });
SpecLimit.belongsTo(Specification, { foreignKey: "specification_id", as: "specification" });

AnalysisComponent.hasMany(SpecLimit, { foreignKey: "analysis_component_id", as: "specLimits" });
SpecLimit.belongsTo(AnalysisComponent, { foreignKey: "analysis_component_id", as: "analysisComponent" });

export default SpecLimit;
