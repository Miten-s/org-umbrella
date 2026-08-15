import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One row of the result-entry grid on a Sample. Its own table rather than a
 * nested collection — at 1M rows a day it cannot be rewritten on every save.
 */
export interface ITestWindow {
  id?: string;
  sampleId: string;
  testId?: string | null;
  analysisName?: string | null;
  componentId?: string | null;
  componentName?: string | null;
  description?: string | null;
  value?: string | null;
  unit?: string | null;
  outOfRange: boolean;
  enteredOn?: Date | string | null;
  enteredBy?: string | null;
  instrumentId?: string | null;
  stockId?: string | null;
}

export class TestWindow extends Model<ITestWindow> implements ITestWindow {
  public id!: string;
  public sampleId!: string;
  public testId!: string | null;
  public analysisName!: string | null;
  public componentId!: string | null;
  public componentName!: string | null;
  public description!: string | null;
  public value!: string | null;
  public unit!: string | null;
  public outOfRange!: boolean;
  public enteredOn!: Date | string | null;
  public enteredBy!: string | null;
  public instrumentId!: string | null;
  public stockId!: string | null;
}

TestWindow.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    sampleId: { type: DataTypes.UUID, allowNull: false, field: "sample_id" },
    testId: { type: DataTypes.UUID, allowNull: true, field: "test_id" },
    analysisName: { type: DataTypes.STRING(200), allowNull: true, field: "analysis_name" },
    componentId: { type: DataTypes.STRING(100), allowNull: true, field: "component_id" },
    componentName: { type: DataTypes.STRING(200), allowNull: true, field: "component_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    outOfRange: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "out_of_range" },
    enteredOn: { type: DataTypes.DATE, allowNull: true, field: "entered_on" },
    enteredBy: { type: DataTypes.STRING(200), allowNull: true, field: "entered_by" },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    stockId: { type: DataTypes.UUID, allowNull: true, field: "stock_id" }
  },
  { sequelize, tableName: "lims_test_windows", underscored: true, timestamps: true }
);

export default TestWindow;
