import { ApplicationFormOutput, ServiceRequestFormOutput } from "@/lib/schema";

export type EntityRef<TName extends string> =
  | string
  | ({ _id: string } & Partial<Record<TName, string>>)
  | null
  | undefined;

export type ServiceRequest = Omit<
  ServiceRequestFormOutput,
  "applicationId" | "environment" | "module" | "workflow" | "group" | "requestRole"
> & {
  _id: string;
  group: EntityRef<"groupName">;
  application: EntityRef<"applicationName">;
  environment: EntityRef<"environmentName">;
  module: EntityRef<"moduleName">;
  requestRole?: EntityRef<"roleName">;
  workflow?: EntityRef<"workflowName">;
  location?: EntityRef<"locationName">;
  attachments?: Array<string | { _id?: string; attachment?: string; filename?: string }>;
  closedOn?: string;
  closedBy?: string;
  __v?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Environment = {
  _id: string;
  environmentName: string;
};

export type AssignmentGroup = {
  _id: string;
  groupName: string;
};

export type Workflow = {
  _id: string;
  workflowName: string;
};

export type ApplicationSoftwareModule = {
  _id: string;
  moduleName: string;
  status?: "enabled" | "disabled";
};

export type Supplier = {
  _id: string;
  supplierName: string;
};

export type Department = {
  _id: string;
  departmentName: string;
};

export type User = {
  _id: string;
  fullName: string;
  name?: string;
  email?: string;
};

export type ApplicationRole = {
  _id: string;
  role: string;
  active?: boolean;
  appId?: string;
};

export type ApplicationGroup = {
  _id: string;
  appGroup: string;
  active?: boolean;
  appId?: string;
};

export type ApplicationServiceRequestType = {
  _id: string;
  service: string;
  active?: boolean;
  appId?: string;
};

export type ApplicationDepartment = {
  _id: string;
  departmentName: string;
  active?: boolean;
  appId?: string;
};

export type Application = Omit<
  ApplicationFormOutput,
  | "applicationEnvironment"
  | "group"
  | "applicationWorkflow"
  | "applicationSystemOwner"
  | "applicationProcessOwner"
  | "supplier"
  | "departments"
  | "applicationRoles"
  | "applicationGroups"
  | "applicationServiceRequestTypes"
  | "applicationModules"
> & {
  _id: string;
  applicationEnvironment?: EntityRef<"environmentName">;
  group?: EntityRef<"groupName">;
  applicationRoles?: ApplicationRole[];
  applicationGroups?: ApplicationGroup[];
  applicationServiceRequestTypes?: ApplicationServiceRequestType[];
  applicationModules?: ApplicationSoftwareModule[];
  applicationWorkflow?: EntityRef<"workflowName">;
  applicationSystemOwner?: EntityRef<"fullName">;
  applicationProcessOwner?: EntityRef<"fullName">;
  supplier?: EntityRef<"supplierName">;
  departments?: ApplicationDepartment[];
  createdOn?: string | null;
  createdBy?: string | null;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
  __v?: number;
};
