import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Application } from "./gxp-service-applications.model";
import { AssignmentGroup } from "./gxp-service-assignment-groups.model";
import { Environment } from "./gxp-service-environments.model";
import { Workflow } from "./gxp-service-workflows.model";
import { AppService } from "./gxp-service-application-services.model";
import { AppModule } from "./gxp-service-application-modules.model";
import { AppRole } from "./gxp-service-application-roles.model";
import { Group } from "./gxp-service-group.model";

export interface IServiceRequest {
  id: string;
  priority: "Very High" | "High" | "Medium" | "Low";
  applicationId: string;
  /** The access-scoping group (see gxp-service-group.model.ts) — distinct from `location`
   * below, which is a plain display string, not an access boundary. Optional here even
   * though the DB enforces NOT NULL (with a default): existing create call sites don't set
   * this yet, and the DB default fills the gap — see the allowNull note in ServiceRequest.init. */
  accessGroupId?: string;
  assignmentGroupId?: string | null;
  location?: string;
  environmentId?: string | null;
  workflowId?: string | null;
  esignCheck: "Yes" | "No";
  trainingDone: boolean;
  description: string;
  shortDescription: string;
  closedOn?: Date | null;
  closedBy?: string | null;
  createdBy?: string | null;
  status:
    | "New"
    | "In Progress"
    | "Hold"
    | "Closed - Incomplete"
    | "Closed - Complete"
    | "Closed - Skipped";
  requestTypesId?: string | null;
  serviceRequestId: string;
  notes: string[];
  /** enabled/disabled toggle — distinct from `status`, which is the request's
   * own workflow state (New/In Progress/Closed…), not an active/inactive flag. */
  recordStatus: "enabled" | "disabled";
}

export class ServiceRequest
  extends Model<IServiceRequest>
  implements IServiceRequest
{
  public id!: string; // Custom string id: "SR_..."
  public priority!: "Very High" | "High" | "Medium" | "Low";
  public applicationId!: string;
  public accessGroupId!: string;
  public assignmentGroupId!: string | null;
  public location!: string;
  public environmentId!: string | null;
  public workflowId!: string | null;
  public esignCheck!: "Yes" | "No";
  public trainingDone!: boolean;
  public description!: string;
  public shortDescription!: string;
  public closedOn!: Date | null;
  public closedBy!: string | null;
  public createdBy!: string | null;
  public status!:
    | "New"
    | "In Progress"
    | "Hold"
    | "Closed - Incomplete"
    | "Closed - Complete"
    | "Closed - Skipped";
  public requestTypesId!: string | null;
  public serviceRequestId!: string;
  public notes!: string[];
  public recordStatus!: "enabled" | "disabled";
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public comments?: any[];
  public attachments?: any[];
}

ServiceRequest.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "application_id",
      references: { model: "applications", key: "id" }
    },
    accessGroupId: {
      type: DataTypes.UUID,
      // Same reasoning as Application.accessGroupId — NOT NULL with a default at the DB
      // level (migration 025), but permissive here so existing create flows that don't
      // set this yet aren't rejected client-side before the DB default can apply.
      allowNull: true,
      field: "access_group_id"
    },
    assignmentGroupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "assignment_group_id",
      references: { model: "assignment_groups", key: "id" }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    environmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "environment_id",
      references: { model: "environments", key: "id" }
    },
    workflowId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "workflow_id",
      references: { model: "workflows", key: "id" }
    },
    esignCheck: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "No",
      field: "esign_check"
    },
    trainingDone: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "training_done"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "short_description"
    },
    closedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "closed_on"
    },
    closedBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "closed_by"
    },
    createdBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "created_by"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "New"
    },
    requestTypesId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "request_types_id",
      references: { model: "app_services", key: "id" }
    },
    serviceRequestId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "service_request_id"
    },
    notes: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: []
    },
    recordStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "enabled",
      field: "record_status"
    }
  },
  {
    sequelize,
    tableName: "service_requests",
    underscored: true,
    timestamps: true
  }
);

// Parent Associations
ServiceRequest.belongsTo(Application, {
  foreignKey: "application_id",
  as: "applicationDetails"
});
ServiceRequest.belongsTo(Group, {
  foreignKey: "access_group_id",
  as: "accessGroup"
});
ServiceRequest.belongsTo(AssignmentGroup, {
  foreignKey: "assignment_group_id",
  as: "assignmentGroupDetails"
});
ServiceRequest.belongsTo(Environment, {
  foreignKey: "environment_id",
  as: "environmentDetails"
});
ServiceRequest.belongsTo(Workflow, {
  foreignKey: "workflow_id",
  as: "workflowDetails"
});
ServiceRequest.belongsTo(AppService, {
  foreignKey: "request_types_id",
  as: "requestTypesDetails"
});

export class ServiceRequestModule extends Model {}
ServiceRequestModule.init(
  {
    service_request_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    module_id: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  },
  {
    sequelize,
    tableName: "service_request_modules",
    timestamps: false,
    underscored: true
  }
);

export class ServiceRequestRole extends Model {}
ServiceRequestRole.init(
  {
    service_request_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  },
  {
    sequelize,
    tableName: "service_request_roles",
    timestamps: false,
    underscored: true
  }
);

// Many-to-Many requested modules and roles
ServiceRequest.belongsToMany(AppModule, {
  through: ServiceRequestModule,
  foreignKey: "service_request_id",
  otherKey: "module_id",
  as: "requestModules"
});
AppModule.belongsToMany(ServiceRequest, {
  through: ServiceRequestModule,
  foreignKey: "module_id",
  otherKey: "service_request_id"
});

ServiceRequest.belongsToMany(AppRole, {
  through: ServiceRequestRole,
  foreignKey: "service_request_id",
  otherKey: "role_id",
  as: "requestRoles"
});
AppRole.belongsToMany(ServiceRequest, {
  through: ServiceRequestRole,
  foreignKey: "role_id",
  otherKey: "service_request_id"
});

export default ServiceRequest;
