import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ILocation {
  id: string;
  locationName: string;
  locationCode?: string;
  description?: string;
  comments?: string;
  status: "active" | "disabled";
  deletedAt?: Date | null;
  modifiedOn?: Date;
  modifiedBy?: string;
}

export class Location extends Model<ILocation> implements ILocation {
  public id!: string;
  public locationName!: string;
  public locationCode!: string;
  public description!: string;
  public comments!: string;
  public status!: "active" | "disabled";
  public deletedAt!: Date | null;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Location.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "location_name"
    },
    locationCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "location_code"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "locations",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);
export default Location;
