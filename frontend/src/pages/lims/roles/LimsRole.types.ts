/** LIMS Role types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

/**
 * A granted permission — the spec's "entry selection for each permission". Assigned
 * from the seeded LIMS_PERMISSIONS catalog (see LimsRole.api.ts), never authored here.
 */
export type LimsRolePermissionRef = { id?: string; name?: string } | string;

export interface LimsRole {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  roleId: string;
  name: string;
  description?: string;
  group?: LimsRef | null;
  permissions?: LimsRolePermissionRef[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsRolePayload {
  roleId: string;
  name: string;
  description?: string;
  group?: string;
  /** Permission ids from the seeded catalog. */
  permissions?: string[];
  changeReason?: string;
}

/** A LIMS permission option {id, name} used to map picker selections (by name) → ids. */
export interface LimsPermissionOption {
  id: string;
  name: string;
}

export const getLimsRolePermissionNames = (role: LimsRole): string[] =>
  (role.permissions ?? [])
    .map((permission) => (typeof permission === "string" ? permission : (permission?.name ?? "")))
    .filter(Boolean);
