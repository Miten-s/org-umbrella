import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IPhraseEntry {
  id?: string;
  phraseId: string;
  entryKey: string;
  entryValue: string;
  sortOrder: number;
  isSystem: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class PhraseEntry extends Model<IPhraseEntry> implements IPhraseEntry {
  public id!: string;
  public phraseId!: string;
  public entryKey!: string;
  public entryValue!: string;
  public sortOrder!: number;
  public isSystem!: boolean;
  public isDeleted!: boolean;
}

PhraseEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    phraseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "phrase_id"
    },
    entryKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "entry_key"
    },
    entryValue: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "entry_value"
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "sort_order"
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_system"
    },
    isDeleted: { 
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
       field: "is_deleted" }
  },
  {
    sequelize,
    tableName: "lims_phrase_entries",
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        name: "lims_phrase_entry_unique_idx",
        unique: true,
        fields: ["phrase_id", "entry_key"],
        where: {
          is_deleted: false
        }
      }
    ]
  }
);

export default PhraseEntry;
