/**
 * Designation module types — single source of truth (STANDARDS.md §1).
 * Canonical id is `id`; `_id` remains only via the normalizeId shim during migration.
 */
export interface Designation {
  id: string;
  /** @deprecated compatibility shim — read `id`. Removed once migration completes. */
  _id: string;
  designationName: string;
  description?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignationPayload {
  designationName: string;
  description?: string;
}
