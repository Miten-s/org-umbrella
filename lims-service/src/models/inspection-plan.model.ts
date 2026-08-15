import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * An Inspection Plan — who reviews what, round-robin or linear.
 */
export interface IInspectionPlan {
  id?: string;
  inspectionId: string;
  name: string;
  description?: string | null;
  inspectionType?: string | null;
  details?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class InspectionPlan extends Model<IInspectionPlan> implements IInspectionPlan {
  public id!: string;
  public inspectionId!: string;
  public name!: string;
  public description!: string | null;
  public inspectionType!: string | null;
  public details!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

InspectionPlan.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    inspectionId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "inspection_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    inspectionType: { type: DataTypes.STRING(50), allowNull: true, field: "inspection_type" },
    details: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_inspection_plans", underscored: true, timestamps: true }
);

export default InspectionPlan;
