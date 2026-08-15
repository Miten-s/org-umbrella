import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * Stock ↔ Supplier join for the "multiple suppliers" field.
 */
export interface IStockSupplier {
  id?: string;
  stockId: string;
  supplierId: string;
}

export class StockSupplier extends Model<IStockSupplier> implements IStockSupplier {
  public id!: string;
  public stockId!: string;
  public supplierId!: string;
}

StockSupplier.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockId: { type: DataTypes.UUID, allowNull: false, field: "stock_id" },
    supplierId: { type: DataTypes.UUID, allowNull: false, field: "supplier_id" }
  },
  { sequelize, tableName: "lims_stock_suppliers", underscored: true, timestamps: true }
);

export default StockSupplier;
