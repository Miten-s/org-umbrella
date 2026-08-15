import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One personnel row on an Inspection Plan — either a person or a role.
 */
export interface IInspectionPersonnel {
  id?: string;
  inspectionPlanId: string;
  inspectionType?: string | null;
  personId?: string | null;
  roleId?: string | null;
}

export class InspectionPersonnel extends Model<IInspectionPersonnel> implements IInspectionPersonnel {
  public id!: string;
  public inspectionPlanId!: string;
  public inspectionType!: string | null;
  public personId!: string | null;
  public roleId!: string | null;
}

InspectionPersonnel.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    inspectionPlanId: { type: DataTypes.UUID, allowNull: false, field: "inspection_plan_id" },
    inspectionType: { type: DataTypes.STRING(50), allowNull: true, field: "inspection_type" },
    personId: { type: DataTypes.UUID, allowNull: true, field: "person_id" },
    roleId: { type: DataTypes.UUID, allowNull: true, field: "role_id" }
  },
  { sequelize, tableName: "lims_inspection_personnel", underscored: true, timestamps: true }
);

export default InspectionPersonnel;
