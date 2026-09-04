/** The permission vocabulary — deliberately code, not data. Byte-identical to
 * frontend/src/utils/permissions.ts (frontend hides affordances, this actually allows/denies). */

/** The 26 LIMS entities, matching the frontend list exactly. */
export const LIMS_ENTITIES = [
  "ALIQUOT",
  "ANALYSIS",
  "BATCH",
  "CALIBRATION",
  "CUSTOMER",
  "GROUP",
  "INSPECTION_PLAN",
  "INSTRUMENT",
  "INSTRUMENT_PART",
  "LOCATION",
  "LOT",
  "PARAMETER",
  "PHRASE",
  "PROJECT",
  "RESULT",
  "ROLE",
  "SAMPLE",
  "SCHEDULER",
  "SPECIFICATION",
  "STOCK",
  "STOCK_BATCH",
  "STUDY",
  "SUPPLIER",
  "TEST",
  "TEST_GROUP",
  "USER"
] as const;

export type LimsEntity = (typeof LIMS_ENTITIES)[number];

/** The four actions — wire names are UPDATE/DELETE though the Role form labels them EDIT/REMOVE. */
export const LIMS_ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE"] as const;

export type LimsAction = (typeof LIMS_ACTIONS)[number];

/** The one permission not entity-scoped — bypasses group filtering entirely; every use is
 * recorded on a separate audit stream (`logBypass()`). */
export const OPERATE_ALL = "OPERATE:ALL";

/** `LIMS:CREATE:SAMPLE` — the canonical wire format. */
export const permissionCode = (action: LimsAction, entity: LimsEntity | string): string =>
  `LIMS:${action}:${entity}`;

/** Which of the four booleans on a role entry grants a given action. */
export const ACTION_COLUMN: Record<LimsAction, "canView" | "canCreate" | "canEdit" | "canRemove"> = {
  VIEW: "canView",
  CREATE: "canCreate",
  UPDATE: "canEdit",
  DELETE: "canRemove"
};

/** Human labels for the Entry dropdown, so the UI never hard-codes them. */
export const ENTITY_LABELS: Record<LimsEntity, string> = {
  ALIQUOT: "Aliquots",
  ANALYSIS: "Analyses",
  BATCH: "Batches",
  CALIBRATION: "Calibrations",
  CUSTOMER: "Customers",
  GROUP: "Lab Groups",
  INSPECTION_PLAN: "Inspection Plans",
  INSTRUMENT: "Instruments",
  INSTRUMENT_PART: "Instrument Parts",
  LOCATION: "Storage Locations",
  LOT: "Lots",
  PARAMETER: "Parameters",
  PHRASE: "Pick Lists",
  PROJECT: "Projects",
  RESULT: "Results",
  ROLE: "Lab Roles",
  SAMPLE: "Samples",
  SCHEDULER: "Schedulers",
  SPECIFICATION: "Specifications",
  STOCK: "Stock Items",
  STOCK_BATCH: "Stock Batches",
  STUDY: "Studies",
  SUPPLIER: "Suppliers",
  TEST: "Tests",
  TEST_GROUP: "Test Groups",
  USER: "Lab Users"
};

export interface PermissionDefinition {
  code: string;
  /** null for global permissions such as OPERATE:ALL. */
  entity: LimsEntity | null;
  action: LimsAction | null;
  label: string;
}

/** All 104 entity permissions plus OPERATE:ALL. */
export const ALL_PERMISSIONS: PermissionDefinition[] = [
  ...LIMS_ENTITIES.flatMap((entity) =>
    LIMS_ACTIONS.map((action) => ({
      code: permissionCode(action, entity),
      entity,
      action,
      label: `${action.charAt(0)}${action.slice(1).toLowerCase()} ${ENTITY_LABELS[entity]}`
    }))
  ),
  {
    code: OPERATE_ALL,
    entity: null,
    action: null,
    label: "Operate All (bypasses group filtering)"
  }
];
