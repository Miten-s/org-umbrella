import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import StockBatch from "./stock-batch.model";
import Location from "./location.model";

export interface IAliquot {
  id?: string;
  batchId: string;
  aliquotLabel: string;
  locationId?: string | null;
  initialAmount: number;
  currentAmount: number;
  expiryDate?: Date | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Aliquot extends Model<IAliquot> implements IAliquot {
  public id!: string;
  public batchId!: string;
  public aliquotLabel!: string;
  public locationId!: string | null;
  public initialAmount!: number;
  public currentAmount!: number;
  public expiryDate!: Date | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

Aliquot.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batchId: { type: DataTypes.UUID, allowNull: false, field: "batch_id" },
    aliquotLabel: { type: DataTypes.STRING(100), allowNull: false, field: "aliquot_label" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    initialAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "initial_amount" },
    currentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "current_amount" },
    expiryDate: { type: DataTypes.DATE, allowNull: true, field: "expiry_date" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_aliquots",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

StockBatch.hasMany(Aliquot, { foreignKey: "batch_id", as: "aliquots" });
Aliquot.belongsTo(StockBatch, { foreignKey: "batch_id", as: "batch" });

Location.hasMany(Aliquot, { foreignKey: "location_id", as: "aliquots" });
Aliquot.belongsTo(Location, { foreignKey: "location_id", as: "location" });

export default Aliquot;
