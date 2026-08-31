import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** A Storage Location. Attribute names match the frontend payload exactly (`locationName`).
 * Self-referencing: `parentLocationId` gives the storage tree, exposed as `parentLocation`/`subLocations`. */
export interface ILocation {
  id?: string;
  locationId: string;
  locationName: string;
  description?: string | null;
  otherInformation?: string | null;
  status?: string;
  locationTypeId?: string | null;
  parentLocationId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Location extends Model<ILocation> implements ILocation {
  public id!: string;
  public locationId!: string;
  public locationName!: string;
  public description!: string | null;
  public otherInformation!: string | null;
  public status!: string;
  public locationTypeId!: string | null;
  public parentLocationId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Location.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    locationId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "location_id"
    },
    locationName: { type: DataTypes.STRING(200), allowNull: false, field: "location_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    otherInformation: { type: DataTypes.TEXT, allowNull: true, field: "other_information" },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "enabled" },
    locationTypeId: { type: DataTypes.UUID, allowNull: true, field: "location_type_id" },
    parentLocationId: { type: DataTypes.UUID, allowNull: true, field: "parent_location_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted"
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_locations", underscored: true, timestamps: true }
);

export default Location;
