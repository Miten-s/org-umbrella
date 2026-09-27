/** LIMS Test Group types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** One row of the group's test list — a Test Template (Analysis) and nothing else. */
export interface LimsTestRow extends Record<string, unknown> {
  id?: string;
  /** The Analysis row's UUID. */
  analysisId?: string;
  /** Display only — the picked template's name, so the cell shows it before any fetch. */
  analysisName?: string;
  sortOrder?: number;
  /** As returned by the server. */
  analysis?: { id: string; analysisId?: string; name?: string } | null;
}

export interface LimsTestGroup {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  testGroupId: string;
  name: string;
  description?: string;
  group?: LimsRef | null;
  tests?: LimsTestRow[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsTestGroupPayload {
  testGroupId: string;
  name: string;
  description?: string;
  group?: string;
  tests?: LimsTestRow[];
  changeReason?: string;
}
