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

export type Ids = { _id: string; name: string }[];

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
  applicationRoles?: Ids;
  applicationGroups?: Ids;
  applicationServiceRequestTypes?: Ids;
  applicationModules?: Ids;
  departments?: Ids;
  attachments?: string[];
}
