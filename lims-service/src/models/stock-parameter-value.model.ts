import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One row of the Parameters grid on a Stock.
 */
export interface IStockParameterValue {
  id?: string;
  stockId: string;
  identity?: string | null;
  value?: string | null;
  unit?: string | null;
}

export class StockParameterValue extends Model<IStockParameterValue> implements IStockParameterValue {
  public id!: string;
  public stockId!: string;
  public identity!: string | null;
  public value!: string | null;
  public unit!: string | null;
}

StockParameterValue.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockId: { type: DataTypes.UUID, allowNull: false, field: "stock_id" },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true }
  },
  { sequelize, tableName: "lims_stock_parameter_values", underscored: true, timestamps: true }
);

export default StockParameterValue;
