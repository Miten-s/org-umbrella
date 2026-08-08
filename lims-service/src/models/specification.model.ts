import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ISpecification {
  id?: string;
  name: string;
  description?: string | null;
  version: number;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Specification extends Model<ISpecification> implements ISpecification {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public version!: number;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

Specification.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_specifications",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

export default Specification;
