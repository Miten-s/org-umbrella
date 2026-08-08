/** LimsInspectionPlan types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsPersonnelRow extends Record<string, unknown> {
  inspectionType?: string | number;
  person?: string | number;
  role?: string | number;
}

export interface LimsInspectionPlan {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  inspectionId?: string;
  name?: string;
  inspectionType?: string;
  group?: LimsRef | null;
  description?: string;
  details?: string;
  personnel?: LimsPersonnelRow[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsInspectionPlanPayload {
  inspectionId: string;
  name: string;
  inspectionType?: string;
  group?: string;
  description?: string;
  details?: string;
  personnel?: LimsPersonnelRow[];
  changeReason?: string;
}
