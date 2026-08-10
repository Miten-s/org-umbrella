/**
 * User module types — single source of truth (STANDARDS.md §1).
 * Canonical id is `id`; `_id` remains only via the normalizeId shim during migration.
 */
export interface UserRole {
  id: string;
  _id: string;
  name: string;
  type: string;
  permissions?: { id: string; name: string }[];
}

export interface EntityRef {
  id: string;
  _id: string;
  /** display name (locationName / departmentName / designationName) */
  [key: string]: unknown;
}

export interface LocationRef extends EntityRef {
  locationName: string;
}
export interface DepartmentRef extends EntityRef {
  departmentName: string;
}
export interface DesignationRef extends EntityRef {
  designationName: string;
}

export interface User {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  description?: string;
  status: "active" | "disabled";
  userType?: "Admin" | "User";
  modifiable?: boolean;
  trainingCompleted?: boolean;
  signature?: string;
  roles: UserRole[];
  location?: LocationRef;
  department?: DepartmentRef;
  designation?: DesignationRef;
}

/** Capability slug for this module (see capabilities.ts). */
export const USER_ENTITY = "user";
