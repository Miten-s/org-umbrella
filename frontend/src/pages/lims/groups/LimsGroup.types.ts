/** LIMS Lab Group types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsGroupRef {
  id: string;
  name?: string;
}

export interface LimsGroup {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  /** Business key, `LIMS_` prefixed. */
  groupId: string;
  name: string;
  description?: string;
  ownedBy?: LimsGroupRef | null;
  parentGroup?: LimsGroupRef | null;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsGroupPayload {
  groupId: string;
  name: string;
  description?: string;
  ownedBy?: string;
  parentGroup?: string;
  /** Required by the audit trail on update. */
  changeReason?: string;
}
