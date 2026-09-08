/** LimsAnalysis types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsComponentRow extends Record<string, unknown> {
  /** The row's real UUID — not shown/editable here, but what Specification's Limits picker
   * links `componentId` to. `componentId` below is the separate, free-text business id. */
  id?: string;
  componentId?: string | number;
  name?: string | number;
  description?: string | number;
  type?: string | number;
  unit?: string | number;
  calculation?: string | number;
  formula?: string | number;
  option?: string | number;
  list?: string | number;
  entity?: string | number;
  entityCriteria?: string | number;
  min?: string | number;
  max?: string | number;
}

export interface LimsAnalysis {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  analysisId?: string;
  name?: string;
  analysisType?: LimsRef | null;
  approvalStatus?: LimsRef | null;
  group?: LimsRef | null;
  inspectionPlan?: LimsRef | null;
  sopReference?: string;
  description?: string;
  details?: string;
  components?: LimsComponentRow[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsAnalysisPayload {
  analysisId: string;
  name: string;
  analysisType?: string;
  approvalStatus?: string;
  group?: string;
  inspectionPlan?: string;
  sopReference?: string;
  description?: string;
  details?: string;
  components?: LimsComponentRow[];
  changeReason?: string;
}
