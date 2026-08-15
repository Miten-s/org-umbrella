import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One consumption record against a Stock Batch.
 */
export interface IStockBatchConsumption {
  id?: string;
  stockBatchId: string;
  consumedOn?: Date | string | null;
  consumedBy?: string | null;
  amount?: string | number | null;
  unit?: string | null;
  remarks?: string | null;
}

export class StockBatchConsumption extends Model<IStockBatchConsumption> implements IStockBatchConsumption {
  public id!: string;
  public stockBatchId!: string;
  public consumedOn!: Date | string | null;
  public consumedBy!: string | null;
  public amount!: string | number | null;
  public unit!: string | null;
  public remarks!: string | null;
}

StockBatchConsumption.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockBatchId: { type: DataTypes.UUID, allowNull: false, field: "stock_batch_id" },
    consumedOn: { type: DataTypes.DATE, allowNull: true, field: "consumed_on" },
    consumedBy: { type: DataTypes.STRING(200), allowNull: true, field: "consumed_by" },
    amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: "lims_stock_batch_consumptions", underscored: true, timestamps: true }
);

export default StockBatchConsumption;
