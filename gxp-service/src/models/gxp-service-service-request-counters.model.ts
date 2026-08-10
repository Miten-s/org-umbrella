import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IServiceRequestCounter {
  applicationId: string;
  seq: number;
}

export class ServiceRequestCounter extends Model<IServiceRequestCounter> implements IServiceRequestCounter {
  public applicationId!: string;
  public seq!: number;
}

ServiceRequestCounter.init(
  {
    applicationId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      field: "application_id",
      references: { model: "applications", key: "id" }
    },
    seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: "service_request_counters",
    underscored: true,
    timestamps: false
  }
);
export default ServiceRequestCounter;
