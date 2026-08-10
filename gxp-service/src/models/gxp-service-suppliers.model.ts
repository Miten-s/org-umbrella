import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ISupplier {
  id: string;
  supplierName: string;
  typeOfSupplier?: string;
  product?: string;
  description?: string;
  status: "enabled" | "disabled";
  createdOn?: Date;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
}

export class Supplier extends Model<ISupplier> implements ISupplier {
  public id!: string;
  public supplierName!: string;
  public typeOfSupplier!: string;
  public product!: string;
  public description!: string;
  public status!: "enabled" | "disabled";
  public createdOn!: Date;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Supplier.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    supplierName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "supplier_name"
    },
    typeOfSupplier: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "type_of_supplier"
    },
    product: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_on"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "suppliers",
    underscored: true,
    timestamps: true
  }
);
export default Supplier;
