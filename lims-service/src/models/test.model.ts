import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Test — one Analysis applied to one Sample. Not versioned: a test carries
 * no measured value of its own, so the generic audit trail is sufficient.
 */
export interface ITest {
  id?: string;
  testId: string;
  testName?: string | null;
  sampleId: string;
  analysisId?: string | null;
  instrumentId?: string | null;
  replicateCount?: number | null;
  loginDate?: Date | string | null;
  loginBy?: string | null;
  description?: string | null;
  status: string;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Test extends Model<ITest> implements ITest {
  public id!: string;
  public testId!: string;
  public testName!: string | null;
  public sampleId!: string;
  public analysisId!: string | null;
  public instrumentId!: string | null;
  public replicateCount!: number | null;
  public loginDate!: Date | string | null;
  public loginBy!: string | null;
  public description!: string | null;
  public status!: string;
  public cancelledAt!: Date | null;
  public cancelledBy!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Test.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    testId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "test_id" },
    testName: { type: DataTypes.STRING(200), allowNull: true, field: "test_name" },
    sampleId: { type: DataTypes.UUID, allowNull: false, field: "sample_id" },
    analysisId: { type: DataTypes.UUID, allowNull: true, field: "analysis_id" },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    replicateCount: { type: DataTypes.INTEGER, allowNull: true, field: "replicate_count" },
    loginDate: { type: DataTypes.DATE, allowNull: true, field: "login_date" },
    loginBy: { type: DataTypes.STRING(200), allowNull: true, field: "login_by" },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Open" },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
    cancelledBy: { type: DataTypes.STRING(100), allowNull: true, field: "cancelled_by" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_tests", underscored: true, timestamps: true }
);

export default Test;
