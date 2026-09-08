/** GXP Application types. The list row + the byId record (which carries nested
 *  refs used to seed the form's AsyncSelects on edit). Relations are loosely
 *  typed since getApplicationById returns populated objects. */
export interface GxpApplication {
  id: string;
  /** @deprecated shim — read `id`. */
  _id: string;
  applicationName: string;
  applicationType?: "GxP" | "Non-GxP";
  moduleId?: string;
  status?: "enabled" | "disabled";
  // nested refs (populated on byId) — used for form seeding
  applicationEnvironment?: any;
  group?: any;
  assignmentGroup?: any;
  applicationWorkflow?: any;
  applicationSystemOwner?: any;
  applicationProcessOwner?: any;
  supplier?: any;
  applicationRoles?: any;
  applicationGroups?: any;
  applicationServiceRequestTypes?: any;
  applicationModules?: any;
  departments?: any;
  notes?: string;
  attachments?: any;
}

/** JSON payload (ids) sent under FormData `data`. Attachments handled separately. */
export interface GxpApplicationPayload {
  applicationName: string;
  applicationType: "GxP" | "Non-GxP";
  applicationEnvironment: string;
  group: string;
  assignmentGroup: string;
  applicationRoles: string[];
  applicationGroups: string[];
  applicationServiceRequestTypes: string[];
  applicationModules: string[];
  applicationWorkflow: string;
  applicationSystemOwner: string;
  applicationProcessOwner: string;
  supplier: string;
  departments: string[];
  notes: string;
  attachments: string[];
  status: "enabled" | "disabled";
}
