/** LIMS Role types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** One granted entry — the spec's "entry selection for each permission". */
export interface LimsRoleEntry extends Record<string, unknown> {
  entry?: string;
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canRemove?: boolean;
}

export interface LimsRole {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  roleId: string;
  name: string;
  description?: string;
  group?: LimsRef | null;
  entries?: LimsRoleEntry[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsRolePayload {
  roleId: string;
  name: string;
  description?: string;
  group?: string;
  entries?: LimsRoleEntry[];
  changeReason?: string;
}
