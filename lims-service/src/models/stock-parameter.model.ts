import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IStockParameter {
  id?: string;
  name: string;
  unitPhraseId?: string | null;
  description?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class StockParameter extends Model<IStockParameter> implements IStockParameter {
  public id!: string;
  public name!: string;
  public unitPhraseId!: string | null;
  public description!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

StockParameter.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    unitPhraseId: { type: DataTypes.UUID, allowNull: true, field: "unit_phrase_id" },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_stock_parameters",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

// ─── Auto-generated associations ───
StockParameter.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
StockParameter.belongsTo(PhraseEntry, { foreignKey: "unit_phrase_id", targetKey: "id", as: "unitPhrase" });

export default StockParameter;
