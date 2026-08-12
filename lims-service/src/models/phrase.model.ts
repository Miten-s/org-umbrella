import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Pick List. `phrase` is the business key the rest of the system references
 * (LOCATION_TYPE, SAMPLE_TYPE…). System lists are seeded and cannot be renamed
 * or removed; their values can still be extended.
 *
 * groupId is nullable — pick lists are global reference data, visible to every
 * group.
 */
export interface IPhrase {
  id?: string;
  phrase: string;
  name: string;
  description?: string | null;
  groupId?: string | null;
  isSystem?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Phrase extends Model<IPhrase> implements IPhrase {
  public id!: string;
  public phrase!: string;
  public name!: string;
  public description!: string | null;
  public groupId!: string | null;
  public isSystem!: boolean;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Phrase.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    phrase: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
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
      field: "is_deleted"
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_phrases", underscored: true, timestamps: true }
);

export default Phrase;
