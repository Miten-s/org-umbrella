/**
 * Endpoint capability flags — see STANDARDS.md §10 and BACKEND_ASKS.md.
 *
 * We design the UI to the TARGET contract but never fake unsupported features.
 * Each flag gates a UI affordance; when false, the affordance is HIDDEN (not
 * faked on the client). Closing a backend ask = flipping one flag here.
 */
export interface TableCapabilities {
  /** server accepts sortBy/sortDir (Ask #1) */
  canSort: boolean;
  /** server accepts filter[...] per-field filters (Ask #2) */
  canFilter: boolean;
  /** batch endpoints accept { filter } — "select all matching" (Ask #3) */
  canBulkByFilter: boolean;
  /** GET {route}/:id exists (Ask #4) */
  canFetchById: boolean;
  /** resolve-by-ids for AsyncSelect labels (Ask #5) */
  canResolveByIds: boolean;
  /** count-by-filter / facet endpoint for tab counts (Ask #8) */
  canFacetCounts: boolean;
}

export const DEFAULT_CAPS: TableCapabilities = {
  canSort: false,
  canFilter: false,
  canBulkByFilter: false,
  canFetchById: false,
  canResolveByIds: false,
  canFacetCounts: false
};

/**
 * Per-entity capability overrides. Keys are the entity slug used by the module.
 * Add overrides here as the backend ships features (see the BACKEND_ASKS tracker).
 */
export const CAPS: Record<string, TableCapabilities> = {
  designation: { ...DEFAULT_CAPS },
  department: { ...DEFAULT_CAPS },
  location: { ...DEFAULT_CAPS },
  supplier: { ...DEFAULT_CAPS },
  workflow: { ...DEFAULT_CAPS },
  environment: { ...DEFAULT_CAPS },
  module: { ...DEFAULT_CAPS },
  assignmentGroup: { ...DEFAULT_CAPS },
  gxpRole: { ...DEFAULT_CAPS },
  gxpPermission: { ...DEFAULT_CAPS },
  gxpUser: { ...DEFAULT_CAPS },
  gxpApplication: { ...DEFAULT_CAPS },
  gxpServiceRequest: { ...DEFAULT_CAPS },
  // canFilter: /auth/users accepts filter[status] (BACKEND_ASKS #2, shipped) →
  // Active/Inactive tabs are server-side. Sort/batch-by-filter still pending.
  user: { ...DEFAULT_CAPS, canFilter: true },
  application: { ...DEFAULT_CAPS, canFetchById: true },
  serviceRequest: { ...DEFAULT_CAPS, canFetchById: true }
};

/** Resolve capabilities for an entity, defaulting to the conservative baseline. */
export const getCapabilities = (entity: string): TableCapabilities =>
  CAPS[entity] ?? DEFAULT_CAPS;
