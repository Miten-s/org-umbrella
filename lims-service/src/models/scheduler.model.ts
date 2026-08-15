import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Scheduler — raises Samples/Tests/Results on a plan. The runner sweeps
 * `nextRunDate` (partial index in migration 009).
 */
export interface IScheduler {
  id?: string;
  schedulerId: string;
  name: string;
  scope?: string | null;
  projectId?: string | null;
  analysisId?: string | null;
  testGroupId?: string | null;
  specificationId?: string | null;
  sampleTypeId?: string | null;
  ownerId?: string | null;
  plan?: string | null;
  planTime?: string | null;
  leadTimeValue?: number | null;
  leadTimeUnit?: string | null;
  lastRunDate?: Date | string | null;
  nextRunDate?: Date | string | null;
  generatedCount: number;
  description?: string | null;
  autoLogin: boolean;
  isActive: boolean;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Scheduler extends Model<IScheduler> implements IScheduler {
  public id!: string;
  public schedulerId!: string;
  public name!: string;
  public scope!: string | null;
  public projectId!: string | null;
  public analysisId!: string | null;
  public testGroupId!: string | null;
  public specificationId!: string | null;
  public sampleTypeId!: string | null;
  public ownerId!: string | null;
  public plan!: string | null;
  public planTime!: string | null;
  public leadTimeValue!: number | null;
  public leadTimeUnit!: string | null;
  public lastRunDate!: Date | string | null;
  public nextRunDate!: Date | string | null;
  public generatedCount!: number;
  public description!: string | null;
  public autoLogin!: boolean;
  public isActive!: boolean;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Scheduler.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    schedulerId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "scheduler_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    scope: { type: DataTypes.STRING(50), allowNull: true },
    projectId: { type: DataTypes.UUID, allowNull: true, field: "project_id" },
    analysisId: { type: DataTypes.UUID, allowNull: true, field: "analysis_id" },
    testGroupId: { type: DataTypes.UUID, allowNull: true, field: "test_group_id" },
    specificationId: { type: DataTypes.UUID, allowNull: true, field: "specification_id" },
    sampleTypeId: { type: DataTypes.UUID, allowNull: true, field: "sample_type_id" },
    ownerId: { type: DataTypes.UUID, allowNull: true, field: "owner_id" },
    plan: { type: DataTypes.STRING(50), allowNull: true },
    planTime: { type: DataTypes.STRING(20), allowNull: true, field: "plan_time" },
    leadTimeValue: { type: DataTypes.INTEGER, allowNull: true, field: "lead_time_value" },
    leadTimeUnit: { type: DataTypes.STRING(20), allowNull: true, field: "lead_time_unit" },
    lastRunDate: { type: DataTypes.DATE, allowNull: true, field: "last_run_date" },
    nextRunDate: { type: DataTypes.DATE, allowNull: true, field: "next_run_date" },
    generatedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "generated_count" },
    description: { type: DataTypes.TEXT, allowNull: true },
    autoLogin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "auto_login" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_schedulers", underscored: true, timestamps: true }
);

export default Scheduler;
