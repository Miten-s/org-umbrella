/**
 * Route prefixes must match the frontend's `<Entity>.api.ts` files exactly —
 * grep `"/lims-` under frontend/src/pages/lims to re-verify. Sub-resources
 * (params, entries) live inside their parent entity's payload, not as their
 * own routes.
 */
const API_ROUTES = {
  ROOT: "/",
  HEALTH: "/health",
  VERSIONS: {
    v1: "/v1/api"
  },

  // Administration
  GROUPS: "/lims-groups",
  ROLES: "/lims-roles",
  PERMISSIONS: "/lims-permissions",
  LIMS_USERS: "/lims-users",
  SCHEDULERS: "/lims-schedulers",

  // Master Data
  PHRASES: "/lims-phrases",
  CUSTOMERS: "/lims-customers",
  SUPPLIERS: "/lims-suppliers",
  PROJECTS: "/lims-projects",
  STUDIES: "/lims-studies",
  LOCATIONS: "/lims-locations",
  STOCK: "/lims-stocks",
  PARAMETERS: "/lims-parameters",
  STOCK_BATCHES: "/lims-stock-batches",
  ALIQUOTS: "/lims-aliquots",
  INSTRUMENTS: "/lims-instruments",
  INSTRUMENT_PARTS: "/lims-instrument-parts",
  CALIBRATIONS: "/lims-calibrations",
  INSPECTION_PLANS: "/lims-inspection-plans",
  ANALYSES: "/lims-analyses",
  TEST_GROUPS: "/lims-test-groups",
  SPECIFICATIONS: "/lims-specifications",

  // Lab Executions
  BATCHES: "/lims-batches",
  LOTS: "/lims-lots",
  SAMPLES: "/lims-samples",
  TESTS: "/lims-tests",
  RESULTS: "/lims-results",

  // Common per-entity sub-paths, appended to the prefixes above.
  PARAMS: "/:id",
  BULK_DELETE: "/bulk-delete",
  BULK_DUPLICATE: "/bulk-duplicate",
  RESTORE: "/restore/:id",
  AUDIT_LOGS: "/:id/audit",
  ENABLE_BY_ID: "/enable/:id",
  DISABLE_BY_ID: "/disable/:id"
};

export default API_ROUTES;
