import { IApplication } from "../models/gxp-service-applications.model";

export type AppError = {
  message: string;
  statusCode?: number;
  stack?: string;
  [key: string]: any;
};

export enum STATUS {
  ENABLED = "enabled",
  DISABLED = "disabled"
}

export type IdItem = string | { _id?: string; name?: string; moduleName?: string; service?: string; role?: string; appGroup?: string };

export type Ids = IdItem[];

export interface UpdateApplication
  extends Pick<
    IApplication,
    | "applicationName"
    | "status"
    | "createdOn"
    | "createdBy"
    | "modifiedOn"
    | "modifiedBy"
  > {
  applicationEnvironment?: string;
  group?: string;
  assignmentGroup?: string;
  applicationRoles?: Ids;
  applicationGroups?: Ids;
  applicationServiceRequestTypes?: Ids;
  applicationModules?: Ids;
  departments?: string[];
  attachments?: string[];
}
