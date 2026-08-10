import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { ServiceRequest } from "./gxp-service-service-requests.model";

export interface IServiceRequestAttachment {
  id?: string;
  serviceRequestId: string;
  attachment: string;
  active: boolean;
  createdBy?: string | null;
}

export class ServiceRequestAttachment extends Model<IServiceRequestAttachment> implements IServiceRequestAttachment {
  public id!: string;
  public serviceRequestId!: string;
  public attachment!: string;
  public active!: boolean;
  public createdBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ServiceRequestAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    serviceRequestId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "service_request_id",
      references: { model: "service_requests", key: "id" }
    },
    attachment: {
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
    tableName: "service_request_attachments",
    underscored: true,
    timestamps: true
  }
);

// One-to-Many request attachments
ServiceRequest.hasMany(ServiceRequestAttachment, { foreignKey: "service_request_id", as: "attachments" });
ServiceRequestAttachment.belongsTo(ServiceRequest, { foreignKey: "service_request_id", as: "serviceRequest" });

export default ServiceRequestAttachment;
