import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** One selectable value inside a pick list, nested in the Phrase payload as `entries[]` —
 * never its own endpoint. `phraseEntryId` is the stable key other records store. */
export interface IPhraseEntry {
  id?: string;
  phraseId: string;
  phraseEntryId: string;
  name?: string | null;
  description?: string | null;
}

export class PhraseEntry extends Model<IPhraseEntry> implements IPhraseEntry {
  public id!: string;
  public phraseId!: string;
  public phraseEntryId!: string;
  public name!: string | null;
  public description!: string | null;
}

PhraseEntry.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    phraseId: { type: DataTypes.UUID, allowNull: false, field: "phrase_id" },
    phraseEntryId: { type: DataTypes.STRING(100), allowNull: false, field: "phrase_entry_id" },
    name: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: "lims_phrase_entries", underscored: true, timestamps: true }
);

export default PhraseEntry;
