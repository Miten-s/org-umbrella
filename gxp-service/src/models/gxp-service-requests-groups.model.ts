import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IGxpServiceRequestGroup {
  id: string;
  requestId: string;
  group: string;
  active: boolean;
  createdBy?: string;
}

export class GxpServiceRequestGroup extends Model<IGxpServiceRequestGroup> implements IGxpServiceRequestGroup {
  public id!: string;
  public requestId!: string;
  public group!: string;
  public active!: boolean;
  public createdBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GxpServiceRequestGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    requestId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "request_id"
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    }
  },
  {
    sequelize,
    tableName: "service_requests_groups",
    underscored: true,
    timestamps: true
  }
);
export default GxpServiceRequestGroup;
