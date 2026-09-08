/** GXP Service Request types (GXP). The list row + the byId record (with nested
 *  refs used by the form's cascade). Relations loosely typed (populated on byId). */
export interface GxpServiceRequest {
  id: string;
  /** @deprecated shim — read `id`. */
  _id: string;
  serviceRequestId?: string;
  application?: any;
  applicationName?: string;
  priority?: "Very High" | "High" | "Medium" | "Low";
  status?: string;
  shortDescription?: string;
  description?: string;
  requestType?: string;
  applicationEnvironment?: any;
  assignmentGroup?: any;
  groupLocation?: any;
  applicationWorkflow?: any;
  applicationModules?: any;
  applicationServiceRequestTypes?: any;
  applicationRoles?: any;
  esignCheck?: "Yes" | "No";
  trainingDone?: boolean;
  notes?: any;
  comments?: string[];
  attachments?: any;
}

/** Payload sent to the SR endpoints (FormData `data`; attachments handled separately). */
export type GxpServiceRequestPayload = Record<string, unknown>;
