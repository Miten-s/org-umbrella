import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Project from "./project.model";

export interface IStudy {
  id?: string;
  projectId: string;
  name: string;
  description?: string | null;
  supervisorId?: string | null;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Study extends Model<IStudy> implements IStudy {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public description!: string | null;
  public supervisorId!: string | null;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;

  public readonly project?: Project;
}

Study.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    projectId: { type: DataTypes.UUID, allowNull: false, field: "project_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    supervisorId: { type: DataTypes.UUID, allowNull: true, field: "supervisor_id" },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_studies",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Project.hasMany(Study, { foreignKey: "project_id", as: "studies" });
Study.belongsTo(Project, { foreignKey: "project_id", as: "project" });

export default Study;
