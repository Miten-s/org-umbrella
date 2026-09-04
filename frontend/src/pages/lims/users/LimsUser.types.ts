/** LimsUser types (STANDARDS.md §1). LIMS does NOT create users — a record just grants an
 * existing platform user access and assigns lab roles, same pattern as GXP Service Users. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** The platform user this record grants LIMS access to. */
export interface LimsUserRef {
  id: string;
  name: string;
}

export interface LimsUser {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  /** Flat columns, not a nested relation (cross-database, can't SQL-join). `LimsUserPayload.user`
   * below is a different shape — what the form SENDS, not what comes back. */
  userId?: string;
  userName?: string;
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
  /** `{ id, name }` of the selected platform user. */
  user: LimsUserRef;
  group?: string;
  location?: string;
  accessGroups?: string[];
  roles?: string[];
  signature?: string;
  description?: string;
  trainingCompleted?: boolean;
  changeReason?: string;
}
