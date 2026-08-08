import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface ILocation {
  id?: string;
  name: string;
  parentId?: string | null;
  locationTypePhraseId?: string | null;
  description?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Location extends Model<ILocation> implements ILocation {
  public id!: string;
  public name!: string;
  public parentId!: string | null;
  public locationTypePhraseId!: string | null;
  public description!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;

  // Self-referencing relationships will be configured here
  public readonly children?: Location[];
  public readonly parent?: Location;
}

Location.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    parentId: { type: DataTypes.UUID, allowNull: true, field: "parent_id" },
    locationTypePhraseId: { type: DataTypes.UUID, allowNull: true, field: "location_type_phrase_id" },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_locations",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Location.hasMany(Location, { foreignKey: "parent_id", as: "children" });
Location.belongsTo(Location, { foreignKey: "parent_id", as: "parent" });

export default Location;
