import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * An Analysis — a test method and the Components it measures.
 */
export interface IAnalysis {
  id?: string;
  analysisId: string;
  name: string;
  analysisTypeId?: string | null;
  approvalStatusId?: string | null;
  inspectionPlanId?: string | null;
  sopReference?: string | null;
  description?: string | null;
  details?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Analysis extends Model<IAnalysis> implements IAnalysis {
  public id!: string;
  public analysisId!: string;
  public name!: string;
  public analysisTypeId!: string | null;
  public approvalStatusId!: string | null;
  public inspectionPlanId!: string | null;
  public sopReference!: string | null;
  public description!: string | null;
  public details!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Analysis.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysisId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "analysis_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    analysisTypeId: { type: DataTypes.UUID, allowNull: true, field: "analysis_type_id" },
    approvalStatusId: { type: DataTypes.UUID, allowNull: true, field: "approval_status_id" },
    inspectionPlanId: { type: DataTypes.UUID, allowNull: true, field: "inspection_plan_id" },
    sopReference: { type: DataTypes.STRING(200), allowNull: true, field: "sop_reference" },
    description: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_analyses", underscored: true, timestamps: true }
);

export default Analysis;
