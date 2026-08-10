/** LIMS Test Group types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** One row of the group's test list (spec §B.15.g). */
export interface LimsTestRow extends Record<string, unknown> {
  testName?: string;
  instrumentCategory?: string;
  instrumentType?: string;
  instrument?: string;
  replicateCount?: number | string;
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
