import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One limit row. Analysis and component are stored by NAME — a spec is
 * authored against names and must stay readable if either is renamed.
 */
export interface ISpecLimit {
  id?: string;
  specificationId: string;
  analysisName?: string | null;
  componentName?: string | null;
  min?: string | null;
  max?: string | null;
  text?: string | null;
  phrase?: string | null;
  boolean?: string | null;
  calculation?: string | null;
  sortOrder?: number | null;
}

export class SpecLimit extends Model<ISpecLimit> implements ISpecLimit {
  public id!: string;
  public specificationId!: string;
  public analysisName!: string | null;
  public componentName!: string | null;
  public min!: string | null;
  public max!: string | null;
  public text!: string | null;
  public phrase!: string | null;
  public boolean!: string | null;
  public calculation!: string | null;
  public sortOrder!: number | null;
}

SpecLimit.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    specificationId: { type: DataTypes.UUID, allowNull: false, field: "specification_id" },
    analysisName: { type: DataTypes.STRING(200), allowNull: true, field: "analysis_name" },
    componentName: { type: DataTypes.STRING(200), allowNull: true, field: "component_name" },
    min: { type: DataTypes.STRING(100), allowNull: true },
    max: { type: DataTypes.STRING(100), allowNull: true },
    text: { type: DataTypes.STRING(255), allowNull: true },
    phrase: { type: DataTypes.STRING(255), allowNull: true },
    boolean: { type: DataTypes.STRING(20), allowNull: true },
    calculation: { type: DataTypes.TEXT, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  { sequelize, tableName: "lims_spec_limits", underscored: true, timestamps: true }
);

export default SpecLimit;
