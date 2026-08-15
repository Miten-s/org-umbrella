import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Study under a Project. `projectDetails` is a snapshot taken when the
 * project was selected, not a live join — see migration 006.
 */
export interface IStudy {
  id?: string;
  studyId: string;
  name: string;
  studyCode?: string | null;
  details?: string | null;
  projectId?: string | null;
  projectDetails?: string | null;
  supervisorId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Study extends Model<IStudy> implements IStudy {
  public id!: string;
  public studyId!: string;
  public name!: string;
  public studyCode!: string | null;
  public details!: string | null;
  public projectId!: string | null;
  public projectDetails!: string | null;
  public supervisorId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Study.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    studyId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "study_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    studyCode: { type: DataTypes.STRING(100), allowNull: true, field: "study_code" },
    details: { type: DataTypes.TEXT, allowNull: true },
    projectId: { type: DataTypes.UUID, allowNull: true, field: "project_id" },
    projectDetails: { type: DataTypes.TEXT, allowNull: true, field: "project_details" },
    supervisorId: { type: DataTypes.UUID, allowNull: true, field: "supervisor_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_studies", underscored: true, timestamps: true }
);

export default Study;
