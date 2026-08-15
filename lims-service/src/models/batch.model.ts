import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Batch — the top of the execution hierarchy, holding Lots.
 * `status` (Open/Cancelled) is separate from `isDeleted`: a cancelled batch
 * stays visible, a removed one does not.
 */
export interface IBatch {
  id?: string;
  batchId: string;
  batchName: string;
  description?: string | null;
  status: string;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Batch extends Model<IBatch> implements IBatch {
  public id!: string;
  public batchId!: string;
  public batchName!: string;
  public description!: string | null;
  public status!: string;
  public cancelledAt!: Date | null;
  public cancelledBy!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Batch.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batchId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "batch_id" },
    batchName: { type: DataTypes.STRING(200), allowNull: false, field: "batch_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Open" },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
    cancelledBy: { type: DataTypes.STRING(100), allowNull: true, field: "cancelled_by" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_batches", underscored: true, timestamps: true }
);

export default Batch;
