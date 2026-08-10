import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IBatch {
  id?: string;
  batchNumber: string;
  description?: string | null;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Batch extends Model<IBatch> implements IBatch {
  public id!: string;
  public batchNumber!: string;
  public description!: string | null;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Batch.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batchNumber: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "batch_number" },
    description: { type: DataTypes.TEXT, allowNull: true },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_batches",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

// ─── Auto-generated associations ───
Batch.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Batch.belongsTo(PhraseEntry, { foreignKey: "status_phrase_id", targetKey: "id", as: "statusPhrase" });

export default Batch;
