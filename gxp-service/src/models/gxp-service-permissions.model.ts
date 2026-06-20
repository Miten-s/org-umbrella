import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IGxpServicePortalPermission {
  id: string;
  permissionName: string;
  description?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export class GxpServicePortalPermission extends Model<IGxpServicePortalPermission> implements IGxpServicePortalPermission {
  public id!: string;
  public permissionName!: string;
  public description!: string;
  public createdBy!: string;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GxpServicePortalPermission.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    permissionName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "permission_name"
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "created_by"
    },
    modifiedBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "gxp_permissions",
    underscored: true,
    timestamps: true
  }
);
export default GxpServicePortalPermission;
