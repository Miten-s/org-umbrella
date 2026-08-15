import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One row of the Parameters grid on a Stock Batch.
 */
export interface IStockBatchParameterValue {
  id?: string;
  stockBatchId: string;
  identity?: string | null;
  value?: string | null;
  unit?: string | null;
}

export class StockBatchParameterValue extends Model<IStockBatchParameterValue> implements IStockBatchParameterValue {
  public id!: string;
  public stockBatchId!: string;
  public identity!: string | null;
  public value!: string | null;
  public unit!: string | null;
}

StockBatchParameterValue.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockBatchId: { type: DataTypes.UUID, allowNull: false, field: "stock_batch_id" },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true }
  },
  { sequelize, tableName: "lims_stock_batch_parameter_values", underscored: true, timestamps: true }
);

export default StockBatchParameterValue;
