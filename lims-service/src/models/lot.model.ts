import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Batch from "./batch.model";

export interface ILot {
  id?: string;
  batchId: string;
  lotNumber: string;
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

export class Lot extends Model<ILot> implements ILot {
  public id!: string;

public batchId!: string;
  public lotNumber!: string;
  public description!: string | null;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Lot.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batchId: { type: DataTypes.UUID, allowNull: false, field: "batch_id" },
    lotNumber: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "lot_number" },
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
    tableName: "lims_lots",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Batch.hasMany(Lot, { foreignKey: "batch_id", as: "lots" });
Lot.belongsTo(Batch, { foreignKey: "batch_id", as: "batch" });

// ─── Auto-generated associations ───
Lot.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Lot.belongsTo(PhraseEntry, { foreignKey: "status_phrase_id", targetKey: "id", as: "statusPhrase" });

export default Lot;
