import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IStock {
  id?: string;
  name: string;
  description?: string | null;
  stockTypePhraseId?: string | null;
  minThreshold?: number | null;
  unitPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Stock extends Model<IStock> implements IStock {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public stockTypePhraseId!: string | null;
  public minThreshold!: number | null;
  public unitPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Stock.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    stockTypePhraseId: { type: DataTypes.UUID, allowNull: true, field: "stock_type_phrase_id" },
    minThreshold: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: "min_threshold" },
    unitPhraseId: { type: DataTypes.UUID, allowNull: true, field: "unit_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_stock",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

// ─── Auto-generated associations ───
Stock.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Stock.belongsTo(PhraseEntry, { foreignKey: "unit_phrase_id", targetKey: "id", as: "unitPhrase" });
Stock.belongsTo(PhraseEntry, { foreignKey: "stock_type_phrase_id", targetKey: "id", as: "stockTypePhrase" });

export default Stock;
