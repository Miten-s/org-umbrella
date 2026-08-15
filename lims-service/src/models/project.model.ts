import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Project. Owns Studies and is referenced by Stock Batches and Samples.
 */
export interface IProject {
  id?: string;
  projectId: string;
  name: string;
  code?: string | null;
  details?: string | null;
  customerId?: string | null;
  customerContact?: string | null;
  supervisorId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Project extends Model<IProject> implements IProject {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public code!: string | null;
  public details!: string | null;
  public customerId!: string | null;
  public customerContact!: string | null;
  public supervisorId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Project.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    projectId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "project_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    customerId: { type: DataTypes.UUID, allowNull: true, field: "customer_id" },
    customerContact: { type: DataTypes.STRING(200), allowNull: true, field: "customer_contact" },
    supervisorId: { type: DataTypes.UUID, allowNull: true, field: "supervisor_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_projects", underscored: true, timestamps: true }
);

export default Project;
