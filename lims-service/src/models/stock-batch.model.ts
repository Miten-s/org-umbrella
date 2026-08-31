import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** A physical batch of a Stock item. `stockBatchId` is derived as "<stockId>/<batchNumber>"
 * on create; `batchNumber` increments per stock, not globally (spec §B.8.b). */
export interface IStockBatch {
  id?: string;
  stockBatchId: string;
  batchNumber: number;
  stockId: string;
  statusId?: string | null;
  projectId?: string | null;
  supplierId?: string | null;
  locationId?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  supplierBatchNumber?: string | null;
  sapBatchId?: string | null;
  internalBatchId?: string | null;
  initialAmount?: string | number | null;
  currentAmount?: string | number | null;
  unit?: string | null;
  description?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class StockBatch extends Model<IStockBatch> implements IStockBatch {
  public id!: string;
  public stockBatchId!: string;
  public batchNumber!: number;
  public stockId!: string;
  public statusId!: string | null;
  public projectId!: string | null;
  public supplierId!: string | null;
  public locationId!: string | null;
  public manufacturingDate!: string | null;
  public expiryDate!: string | null;
  public supplierBatchNumber!: string | null;
  public sapBatchId!: string | null;
  public internalBatchId!: string | null;
  public initialAmount!: string | number | null;
  public currentAmount!: string | number | null;
  public unit!: string | null;
  public description!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

StockBatch.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockBatchId: { type: DataTypes.STRING(150), allowNull: false, unique: true, field: "stock_batch_id" },
    batchNumber: { type: DataTypes.INTEGER, allowNull: false, field: "batch_number" },
    stockId: { type: DataTypes.UUID, allowNull: false, field: "stock_id" },
    statusId: { type: DataTypes.UUID, allowNull: true, field: "status_id" },
    projectId: { type: DataTypes.UUID, allowNull: true, field: "project_id" },
    supplierId: { type: DataTypes.UUID, allowNull: true, field: "supplier_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    manufacturingDate: { type: DataTypes.DATEONLY, allowNull: true, field: "manufacturing_date" },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: "expiry_date" },
    supplierBatchNumber: { type: DataTypes.STRING(150), allowNull: true, field: "supplier_batch_number" },
    sapBatchId: { type: DataTypes.STRING(150), allowNull: true, field: "sap_batch_id" },
    internalBatchId: { type: DataTypes.STRING(150), allowNull: true, field: "internal_batch_id" },
    initialAmount: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "initial_amount" },
    currentAmount: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "current_amount" },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_stock_batches", underscored: true, timestamps: true }
);

export default StockBatch;
