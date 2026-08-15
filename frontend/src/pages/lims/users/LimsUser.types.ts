/** LimsUser types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5.
 *
 * LIMS does NOT create users. Platform users are created in System IT
 * Administration; a LIMS user record just grants an existing user access to
 * LIMS and assigns their lab roles — the same pattern as GXP Service Users.
 */

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
  /**
   * The platform user, as the API actually returns it: flat columns, not a
   * nested relation — lims-service can't SQL-join across databases, so this
   * is denormalized onto the row rather than populated. `LimsUserPayload.user`
   * (below) is a different shape: what the form SENDS, not what comes back.
   */
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
