import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Environment } from "./gxp-service-environments.model";
import { AssignmentGroup } from "./gxp-service-assignment-groups.model";
import { Workflow } from "./gxp-service-workflows.model";
import { Supplier } from "./gxp-service-suppliers.model";
import { AppModule } from "./gxp-service-application-modules.model";
import { AppAttachment } from "./gxp-service-application-attachments.model";
import { AppGroup } from "./gxp-service-application-groups.model";
import { AppDepartment } from "./gxp-service-application-departments.model";
import { AppRole } from "./gxp-service-application-roles.model";
import { AppService } from "./gxp-service-application-services.model";

export interface IApplication {
  id: string;
  applicationName: string;
  applicationId?: string;
  applicationType: "GxP" | "Non-GxP";
  applicationEnvironmentId?: string | null;
  group: string;
  assignmentGroupId?: string | null;
  applicationWorkflowId?: string | null;
  applicationSystemOwnerId?: string | null;
  applicationProcessOwnerId?: string | null;
  supplierId?: string | null;
  notes?: string;
  status: "enabled" | "disabled";
  createdOn?: Date;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
}

export class Application extends Model<IApplication> implements IApplication {
  public id!: string;
  public applicationName!: string;
  public applicationId!: string;
  public applicationType!: "GxP" | "Non-GxP";
  public applicationEnvironmentId!: string | null;
  public group!: string;
  public assignmentGroupId!: string | null;
  public applicationWorkflowId!: string | null;
  public applicationSystemOwnerId!: string | null;
  public applicationProcessOwnerId!: string | null;
  public supplierId!: string | null;
  public notes!: string;
  public status!: "enabled" | "disabled";
  public createdOn!: Date;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Application.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    applicationName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "application_name"
    },
    applicationId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "application_id"
    },
    applicationType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "application_type"
    },
    applicationEnvironmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "application_environment_id"
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assignmentGroupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "assignment_group_id"
    },
    applicationWorkflowId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "application_workflow_id"
    },
    applicationSystemOwnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "application_system_owner_id"
    },
    applicationProcessOwnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "application_process_owner_id"
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "supplier_id"
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: "applications",
    underscored: true,
    timestamps: true
  }
);

// Associations

// Parent Links
Application.belongsTo(Environment, { foreignKey: "application_environment_id", as: "environment" });
Application.belongsTo(AssignmentGroup, { foreignKey: "assignment_group_id", as: "assignmentGroup" });
Application.belongsTo(Workflow, { foreignKey: "application_workflow_id", as: "workflow" });
Application.belongsTo(Supplier, { foreignKey: "supplier_id", as: "supplier" });

// 1-to-Many Child Tables
Application.hasMany(AppModule, { foreignKey: "application_id", as: "applicationModules" });
AppModule.belongsTo(Application, { foreignKey: "application_id", as: "application" });

Application.hasMany(AppAttachment, { foreignKey: "application_id", as: "attachments" });
AppAttachment.belongsTo(Application, { foreignKey: "application_id", as: "application" });

Application.hasMany(AppGroup, { foreignKey: "application_id", as: "applicationGroups" });
AppGroup.belongsTo(Application, { foreignKey: "application_id", as: "application" });

Application.hasMany(AppDepartment, { foreignKey: "application_id", as: "departments" });
AppDepartment.belongsTo(Application, { foreignKey: "application_id", as: "application" });

export class ApplicationAppRole extends Model {}
ApplicationAppRole.init({
  application_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "application_app_roles",
  timestamps: false,
  underscored: true
});

export class ApplicationAppService extends Model {}
ApplicationAppService.init({
  application_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  service_id: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "application_app_services",
  timestamps: false,
  underscored: true
});

// Many-to-Many Application Roles & Services
Application.belongsToMany(AppRole, {
  through: ApplicationAppRole,
  foreignKey: "application_id",
  otherKey: "role_id",
  as: "applicationRoles"
});
AppRole.belongsToMany(Application, {
  through: ApplicationAppRole,
  foreignKey: "role_id",
  otherKey: "application_id"
});

Application.belongsToMany(AppService, {
  through: ApplicationAppService,
  foreignKey: "application_id",
  otherKey: "service_id",
  as: "applicationServiceRequestTypes"
});
AppService.belongsToMany(Application, {
  through: ApplicationAppService,
  foreignKey: "service_id",
  otherKey: "application_id"
});


export default Application;
