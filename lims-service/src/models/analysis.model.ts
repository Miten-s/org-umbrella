import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import InspectionPlan from "./inspection-plan.model";

export interface IAnalysis {
  id?: string;
  name: string;
  description?: string | null;
  version: number;
  approvalStatusPhraseId?: string | null;
  sopReference?: string | null;
  inspectionPlanId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Analysis extends Model<IAnalysis> implements IAnalysis {
  public id!: string;

public name!: string;
  public description!: string | null;
  public version!: number;
  public approvalStatusPhraseId!: string | null;
  public sopReference!: string | null;
  public inspectionPlanId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Analysis.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    approvalStatusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "approval_status_phrase_id" },
    sopReference: { type: DataTypes.STRING(255), allowNull: true, field: "sop_reference" },
    inspectionPlanId: { type: DataTypes.UUID, allowNull: true, field: "inspection_plan_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_analyses",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

InspectionPlan.hasMany(Analysis, { foreignKey: "inspection_plan_id", as: "analyses" });
Analysis.belongsTo(InspectionPlan, { foreignKey: "inspection_plan_id", as: "inspectionPlan" });

// ─── Auto-generated associations ───
Analysis.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Analysis.belongsTo(PhraseEntry, { foreignKey: "approval_status_phrase_id", targetKey: "id", as: "approvalStatusPhrase" });

export default Analysis;
