import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One measured Component of an Analysis. `type` decides which of the value
 * columns below carry meaning, so they are all loosely typed strings.
 */
export interface IAnalysisComponent {
  id?: string;
  analysisId: string;
  componentId?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  unit?: string | null;
  calculation?: string | null;
  formula?: string | null;
  option?: string | null;
  list?: string | null;
  entity?: string | null;
  entityCriteria?: string | null;
  min?: string | null;
  max?: string | null;
  sortOrder?: number | null;
}

export class AnalysisComponent extends Model<IAnalysisComponent> implements IAnalysisComponent {
  public id!: string;
  public analysisId!: string;
  public componentId!: string | null;
  public name!: string | null;
  public description!: string | null;
  public type!: string | null;
  public unit!: string | null;
  public calculation!: string | null;
  public formula!: string | null;
  public option!: string | null;
  public list!: string | null;
  public entity!: string | null;
  public entityCriteria!: string | null;
  public min!: string | null;
  public max!: string | null;
  public sortOrder!: number | null;
}

AnalysisComponent.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysisId: { type: DataTypes.UUID, allowNull: false, field: "analysis_id" },
    componentId: { type: DataTypes.STRING(100), allowNull: true, field: "component_id" },
    name: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING(50), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    calculation: { type: DataTypes.TEXT, allowNull: true },
    formula: { type: DataTypes.TEXT, allowNull: true },
    option: { type: DataTypes.STRING(255), allowNull: true },
    list: { type: DataTypes.TEXT, allowNull: true },
    entity: { type: DataTypes.STRING(150), allowNull: true },
    entityCriteria: { type: DataTypes.TEXT, allowNull: true, field: "entity_criteria" },
    min: { type: DataTypes.STRING(100), allowNull: true },
    max: { type: DataTypes.STRING(100), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  { sequelize, tableName: "lims_analysis_components", underscored: true, timestamps: true }
);

export default AnalysisComponent;
