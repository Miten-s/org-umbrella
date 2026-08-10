import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Sample from "./sample.model";
import Analysis from "./analysis.model";
import Instrument from "./instrument.model";

export interface ITest {
  id?: string;
  sampleId: string;
  analysisId: string;
  statusPhraseId?: string | null;
  instrumentId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Test extends Model<ITest> implements ITest {
  public id!: string;

public sampleId!: string;
  public analysisId!: string;
  public statusPhraseId!: string | null;
  public instrumentId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Test.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    sampleId: { type: DataTypes.UUID, allowNull: false, field: "sample_id" },
    analysisId: { type: DataTypes.UUID, allowNull: false, field: "analysis_id" },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_tests",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Sample.hasMany(Test, { foreignKey: "sample_id", as: "tests" });
Test.belongsTo(Sample, { foreignKey: "sample_id", as: "sample" });

Analysis.hasMany(Test, { foreignKey: "analysis_id", as: "tests" });
Test.belongsTo(Analysis, { foreignKey: "analysis_id", as: "analysis" });

Instrument.hasMany(Test, { foreignKey: "instrument_id", as: "tests" });
Test.belongsTo(Instrument, { foreignKey: "instrument_id", as: "instrument" });

// ─── Auto-generated associations ───
Test.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Test.belongsTo(PhraseEntry, { foreignKey: "status_phrase_id", targetKey: "id", as: "statusPhrase" });

export default Test;
