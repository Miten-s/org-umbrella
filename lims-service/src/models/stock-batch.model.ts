import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Stock from "./stock.model";
import Location from "./location.model";
import Supplier from "./supplier.model";

export interface IStockBatch {
  id?: string;
  stockId: string;
  batchNumber: string;
  supplierId?: string | null;
  locationId?: string | null;
  initialAmount: number;
  currentAmount: number;
  expiryDate?: Date | null;
  receivedDate?: Date | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StockBatch extends Model<IStockBatch> implements IStockBatch {
  public id!: string;
  public stockId!: string;
  public batchNumber!: string;
  public supplierId!: string | null;
  public locationId!: string | null;
  public initialAmount!: number;
  public currentAmount!: number;
  public expiryDate!: Date | null;
  public receivedDate!: Date | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

StockBatch.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockId: { type: DataTypes.UUID, allowNull: false, field: "stock_id" },
    batchNumber: { type: DataTypes.STRING(100), allowNull: false, field: "batch_number" },
    supplierId: { type: DataTypes.UUID, allowNull: true, field: "supplier_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    initialAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "initial_amount" },
    currentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "current_amount" },
    expiryDate: { type: DataTypes.DATE, allowNull: true, field: "expiry_date" },
    receivedDate: { type: DataTypes.DATE, allowNull: true, field: "received_date" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_stock_batches",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Stock.hasMany(StockBatch, { foreignKey: "stock_id", as: "batches" });
StockBatch.belongsTo(Stock, { foreignKey: "stock_id", as: "stock" });

Location.hasMany(StockBatch, { foreignKey: "location_id", as: "batches" });
StockBatch.belongsTo(Location, { foreignKey: "location_id", as: "location" });

Supplier.hasMany(StockBatch, { foreignKey: "supplier_id", as: "batches" });
StockBatch.belongsTo(Supplier, { foreignKey: "supplier_id", as: "supplier" });

export default StockBatch;
