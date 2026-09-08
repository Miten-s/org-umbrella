/**
 * Department module types (STANDARDS.md §1). Canonical id is `id`.
 * The list endpoint returns manager/location nested as `{ id, name }` /
 * `{ id, locationName }` — used to seed AsyncSelect labels on edit (§4).
 */
export interface DepartmentRef {
  id: string;
  _id: string;
  name?: string;
  locationName?: string;
}

export interface Department {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  departmentId?: string;
  departmentName: string;
  description?: string;
  departmentManager?: DepartmentRef;
  departmentGroupLocation?: DepartmentRef;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentPayload {
  departmentName: string;
  description?: string;
  departmentManager: string;
  departmentGroupLocation: string;
}
