import LimsUser from "./lims-user.model";
import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Customer from "./customer.model";
import Study from "./study.model";

export interface IProject {
  id?: string;
  name: string;
  description?: string | null;
  customerId?: string | null;
  supervisorId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Project extends Model<IProject> implements IProject {
  public id!: string;

public name!: string;
  public description!: string | null;
  public customerId!: string | null;
  public supervisorId!: string | null;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

  public readonly customer?: Customer;
  public readonly studies?: Study[];

}

Project.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    customerId: { type: DataTypes.UUID, allowNull: true, field: "customer_id" },
    supervisorId: { type: DataTypes.UUID, allowNull: true, field: "supervisor_id" },
    startDate: { type: DataTypes.DATE, allowNull: true, field: "start_date" },
    endDate: { type: DataTypes.DATE, allowNull: true, field: "end_date" },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_projects",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Customer.hasMany(Project, { foreignKey: "customer_id", as: "projects" });
Project.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

// ─── Auto-generated associations ───
Project.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
Project.belongsTo(PhraseEntry, { foreignKey: "status_phrase_id", targetKey: "id", as: "statusPhrase" });
Project.belongsTo(LimsUser, { foreignKey: "supervisor_id", targetKey: "userId", as: "supervisor" });

export default Project;
