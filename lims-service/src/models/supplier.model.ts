import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Supplier. Same shape as Customer minus the project links.
 */
export interface ISupplier {
  id?: string;
  supplierId: string;
  supplierName: string;
  description?: string | null;
  ratingId?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  email?: string | null;
  address?: Record<string, string> | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Supplier extends Model<ISupplier> implements ISupplier {
  public id!: string;
  public supplierId!: string;
  public supplierName!: string;
  public description!: string | null;
  public ratingId!: string | null;
  public website!: string | null;
  public contactName!: string | null;
  public contactPhone!: string | null;
  public email!: string | null;
  public address!: Record<string, string> | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Supplier.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    supplierId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "supplier_id" },
    supplierName: { type: DataTypes.STRING(200), allowNull: false, field: "supplier_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    ratingId: { type: DataTypes.UUID, allowNull: true, field: "rating_id" },
    website: { type: DataTypes.STRING(255), allowNull: true },
    contactName: { type: DataTypes.STRING(200), allowNull: true, field: "contact_name" },
    contactPhone: { type: DataTypes.STRING(50), allowNull: true, field: "contact_phone" },
    email: { type: DataTypes.STRING(200), allowNull: true },
    address: { type: DataTypes.JSONB, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_suppliers", underscored: true, timestamps: true }
);

export default Supplier;
