import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import PhraseEntry from "./phrase-entry.model";

export interface IPhrase {
  id?: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  groupId?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Phrase extends Model<IPhrase> implements IPhrase {
  public id!: string;

public name!: string;
  public description!: string | null;
  public isSystem!: boolean;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

  public readonly entries?: PhraseEntry[];

}

Phrase.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_system"
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "group_id"
    },
    isDeleted: { 
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
       field: "is_deleted" },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "deleted_by"
    },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_phrases",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Phrase.hasMany(PhraseEntry, { foreignKey: "phrase_id", as: "entries" });
PhraseEntry.belongsTo(Phrase, { foreignKey: "phrase_id", as: "phrase" });

export default Phrase;
