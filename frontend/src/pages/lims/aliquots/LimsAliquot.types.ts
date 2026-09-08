/** LimsAliquot types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAliquotRow extends Record<string, unknown> {
  aliquotId?: string | number;
  description?: string | number;
  quantity?: string | number;
  unit?: string | number;
}

export interface LimsAliquot {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  aliquotSetId?: string;
  stockBatch?: LimsRef | null;
  aliquotsNumber?: number | string;
  aliquots?: LimsAliquotRow[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsAliquotPayload {
  aliquotSetId: string;
  stockBatch: string;
  aliquotsNumber?: number | string;
  aliquots?: LimsAliquotRow[];
  changeReason?: string;
}
