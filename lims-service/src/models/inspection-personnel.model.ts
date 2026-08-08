import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import InspectionPlan from "./inspection-plan.model";

export interface IInspectionPersonnel {
  id?: string;
  planId: string;
  stepOrder: number;
  roleId?: string | null;
  userId?: string | null;
  stepDescription?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InspectionPersonnel extends Model<IInspectionPersonnel> implements IInspectionPersonnel {
  public id!: string;
  public planId!: string;
  public stepOrder!: number;
  public roleId!: string | null;
  public userId!: string | null;
  public stepDescription!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

InspectionPersonnel.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    planId: { type: DataTypes.UUID, allowNull: false, field: "plan_id" },
    stepOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: "step_order" },
    roleId: { type: DataTypes.UUID, allowNull: true, field: "role_id" },
    userId: { type: DataTypes.UUID, allowNull: true, field: "user_id" },
    stepDescription: { type: DataTypes.STRING(255), allowNull: true, field: "step_description" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_inspection_personnel",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

InspectionPlan.hasMany(InspectionPersonnel, { foreignKey: "plan_id", as: "personnelSteps" });
InspectionPersonnel.belongsTo(InspectionPlan, { foreignKey: "plan_id", as: "plan" });

export default InspectionPersonnel;
