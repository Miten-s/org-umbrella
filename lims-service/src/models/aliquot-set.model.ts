import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A set of aliquots split off one Stock Batch. The UI models the SET ("split
 * this into 12"), with the individual aliquots as its rows.
 */
export interface IAliquotSet {
  id?: string;
  aliquotSetId: string;
  stockBatchId: string;
  aliquotsNumber?: number | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class AliquotSet extends Model<IAliquotSet> implements IAliquotSet {
  public id!: string;
  public aliquotSetId!: string;
  public stockBatchId!: string;
  public aliquotsNumber!: number | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

AliquotSet.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    aliquotSetId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "aliquot_set_id" },
    stockBatchId: { type: DataTypes.UUID, allowNull: false, field: "stock_batch_id" },
    aliquotsNumber: { type: DataTypes.INTEGER, allowNull: true, field: "aliquots_number" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_aliquot_sets", underscored: true, timestamps: true }
);

export default AliquotSet;
