import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Stock item — the definition of a consumable, not a physical quantity.
 * Actual material lives in its Stock Batches.
 */
export interface IStock {
  id?: string;
  stockId: string;
  stockName: string;
  stockTypeId?: string | null;
  operatorId?: string | null;
  defaultLocationId?: string | null;
  preferredSupplierId?: string | null;
  unit?: string | null;
  targetAmount?: string | number | null;
  lowAmount?: string | number | null;
  lowPercentage?: string | number | null;
  description?: string | null;
  details?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Stock extends Model<IStock> implements IStock {
  public id!: string;
  public stockId!: string;
  public stockName!: string;
  public stockTypeId!: string | null;
  public operatorId!: string | null;
  public defaultLocationId!: string | null;
  public preferredSupplierId!: string | null;
  public unit!: string | null;
  public targetAmount!: string | number | null;
  public lowAmount!: string | number | null;
  public lowPercentage!: string | number | null;
  public description!: string | null;
  public details!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Stock.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stockId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "stock_id" },
    stockName: { type: DataTypes.STRING(200), allowNull: false, field: "stock_name" },
    stockTypeId: { type: DataTypes.UUID, allowNull: true, field: "stock_type_id" },
    operatorId: { type: DataTypes.UUID, allowNull: true, field: "operator_id" },
    defaultLocationId: { type: DataTypes.UUID, allowNull: true, field: "default_location_id" },
    preferredSupplierId: { type: DataTypes.UUID, allowNull: true, field: "preferred_supplier_id" },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    targetAmount: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "target_amount" },
    lowAmount: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "low_amount" },
    lowPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: "low_percentage" },
    description: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_stocks", underscored: true, timestamps: true }
);

export default Stock;
