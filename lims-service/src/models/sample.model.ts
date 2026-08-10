import Group from "./group.model";
import PhraseEntry from "./phrase-entry.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Lot from "./lot.model";
import TestGroup from "./test-group.model";

export interface ISample {
  id?: string;
  lotId?: string | null;
  sampleNumber: string;
  description?: string | null;
  statusPhraseId?: string | null;
  loggedInAt?: Date | null;
  loggedInBy?: string | null;
  priority: number;
  testGroupId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Sample extends Model<ISample> implements ISample {
  public id!: string;

public lotId!: string | null;
  public sampleNumber!: string;
  public description!: string | null;
  public statusPhraseId!: string | null;
  public loggedInAt!: Date | null;
  public loggedInBy!: string | null;
  public priority!: number;
  public testGroupId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Sample.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lotId: { type: DataTypes.UUID, allowNull: true, field: "lot_id" },
    sampleNumber: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "sample_number" },
    description: { type: DataTypes.TEXT, allowNull: true },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    loggedInAt: { type: DataTypes.DATE, allowNull: true, field: "logged_in_at" },
    loggedInBy: { type: DataTypes.UUID, allowNull: true, field: "logged_in_by" },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    testGroupId: { type: DataTypes.UUID, allowNull: true, field: "test_group_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_samples",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Lot.hasMany(Sample, { foreignKey: "lot_id", as: "samples" });
Sample.belongsTo(Lot, { foreignKey: "lot_id", as: "lot" });

TestGroup.hasMany(Sample, { foreignKey: "test_group_id", as: "samples" });
Sample.belongsTo(TestGroup, { foreignKey: "test_group_id", as: "testGroup" });

// ─── Auto-generated associations ───
Sample.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Sample.belongsTo(PhraseEntry, { foreignKey: "status_phrase_id", targetKey: "id", as: "statusPhrase" });

export default Sample;
