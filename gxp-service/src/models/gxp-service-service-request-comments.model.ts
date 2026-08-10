import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { ServiceRequest } from "./gxp-service-service-requests.model";

export interface IServiceRequestComment {
  id?: number;
  serviceRequestId: string;
  commentText: string;
}

export class ServiceRequestComment extends Model<IServiceRequestComment> implements IServiceRequestComment {
  public id!: number;
  public serviceRequestId!: string;
  public commentText!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ServiceRequestComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    serviceRequestId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "service_request_id",
      references: { model: "service_requests", key: "id" }
    },
    commentText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "comment_text"
    }
  },
  {
    sequelize,
    tableName: "service_request_comments",
    underscored: true,
    timestamps: true
  }
);

// One-to-Many request comments
ServiceRequest.hasMany(ServiceRequestComment, { foreignKey: "service_request_id", as: "comments" });
ServiceRequestComment.belongsTo(ServiceRequest, { foreignKey: "service_request_id", as: "serviceRequest" });

export default ServiceRequestComment;
