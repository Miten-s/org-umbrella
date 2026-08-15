import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Lot within a Batch, holding Samples.
 */
export interface ILot {
  id?: string;
  lotId: string;
  lotName: string;
  description?: string | null;
  batchId?: string | null;
  status: string;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Lot extends Model<ILot> implements ILot {
  public id!: string;
  public lotId!: string;
  public lotName!: string;
  public description!: string | null;
  public batchId!: string | null;
  public status!: string;
  public cancelledAt!: Date | null;
  public cancelledBy!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Lot.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lotId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "lot_id" },
    lotName: { type: DataTypes.STRING(200), allowNull: false, field: "lot_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    batchId: { type: DataTypes.UUID, allowNull: true, field: "batch_id" },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Open" },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
    cancelledBy: { type: DataTypes.STRING(100), allowNull: true, field: "cancelled_by" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_lots", underscored: true, timestamps: true }
);

export default Lot;
