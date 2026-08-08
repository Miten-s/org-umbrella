/** LimsUser types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}


export interface LimsUser {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  userId?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  group?: LimsRef | null;
  location?: LimsRef | null;
  accessGroups?: LimsRef[];
  roles?: LimsRef[];
  signature?: string;
  description?: string;
  trainingCompleted?: boolean;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsUserPayload {
  userId: string;
  name: string;
  email?: string;
  mobileNumber?: string;
  group?: string;
  location?: string;
  accessGroups?: string[];
  roles?: string[];
  signature?: string;
  description?: string;
  trainingCompleted?: boolean;
  changeReason?: string;
}
