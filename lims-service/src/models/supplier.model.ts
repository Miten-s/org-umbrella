import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ISupplier {
  id?: string;
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ratingPhraseId?: string | null;
  notes?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Supplier extends Model<ISupplier> implements ISupplier {
  public id!: string;
  public name!: string;
  public contactEmail!: string | null;
  public contactPhone!: string | null;
  public ratingPhraseId!: string | null;
  public notes!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

Supplier.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true, field: "contact_email" },
    contactPhone: { type: DataTypes.STRING(50), allowNull: true, field: "contact_phone" },
    ratingPhraseId: { type: DataTypes.UUID, allowNull: true, field: "rating_phrase_id" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_suppliers",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

export default Supplier;
