/** Test Template component types and what each one uses. Mirrored in the frontend's
 * `pages/lims/analyses/componentTypes.ts` — separate deployables, keep the two in step. */

export const COMPONENT_TYPES = [
  "BLANK",
  "DESCRIPTION",
  "TEXT",
  "VALUE",
  "CALCULATION",
  "LIST",
  "BOOLEAN",
  "ENTITY",
  "DATETIME"
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

/** Type-specific columns. Anything a row's type doesn't list is cleared on save. */
export const TYPE_FIELDS: Record<ComponentType, string[]> = {
  BLANK: [],
  DESCRIPTION: [],
  TEXT: [],
  VALUE: ["unit", "min", "max"],
  CALCULATION: ["unit", "formula", "min", "max"],
  LIST: ["list", "option"],
  BOOLEAN: ["option"],
  ENTITY: ["entity", "entityCriteria"],
  DATETIME: []
};

export const TYPE_SPECIFIC_FIELDS = [
  "unit",
  "calculation",
  "formula",
  "option",
  "list",
  "entity",
  "entityCriteria",
  "min",
  "max"
];

/** Boolean answers come as a fixed wording pair — the first word is the "true" answer. */
export const BOOLEAN_OPTIONS = [
  "YES_NO",
  "PASS_FAIL",
  "COMPLIES",
  "PRESENT_ABSENT"
] as const;

export type CriteriaSource =
  { phrase: string } | { entity: "GROUP" | "LOCATION" | "STOCK" | "BATCH" };

/** Records a component can point at, and the columns its criteria may filter on. */
export const COMPONENT_ENTITIES: Record<
  string,
  Record<string, CriteriaSource>
> = {
  INSTRUMENT: {
    typeId: { phrase: "INSTRUMENT_TYPE" },
    measurementTypeId: { phrase: "MEASUREMENT_TYPE" },
    statusId: { phrase: "INSTRUMENT_STATUS" },
    locationId: { entity: "LOCATION" },
    groupId: { entity: "GROUP" }
  },
  STOCK: {
    stockTypeId: { phrase: "STOCK_TYPE" },
    groupId: { entity: "GROUP" }
  },
  STOCK_BATCH: {
    statusId: { phrase: "STOCK_BATCH_STATUS" },
    stockId: { entity: "STOCK" },
    groupId: { entity: "GROUP" }
  },
  LIMS_USER: {
    groupId: { entity: "GROUP" },
    locationId: { entity: "LOCATION" }
  },
  LOCATION: {
    locationTypeId: { phrase: "LOCATION_TYPE" },
    groupId: { entity: "GROUP" }
  },
  SUPPLIER: {
    ratingId: { phrase: "RATING" },
    groupId: { entity: "GROUP" }
  },
  CUSTOMER: {
    ratingId: { phrase: "RATING" },
    groupId: { entity: "GROUP" }
  },
  LOT: {
    batchId: { entity: "BATCH" },
    groupId: { entity: "GROUP" }
  },
  BATCH: {
    groupId: { entity: "GROUP" }
  }
};

/** `{TITRE} * {FACTOR} / {WEIGHT} * 100` → ["TITRE", "FACTOR", "WEIGHT"]. */
export const formulaReferences = (formula: string): string[] =>
  [...formula.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1].trim());

/** A formula may only hold numbers, + - * / ( ) and `{component}` references. */
export const isFormulaWellFormed = (formula: string): boolean => {
  const outside = formula.replace(/\{[^{}]+\}/g, "0");
  if (!/^[0-9+\-*/().\s]+$/.test(outside)) return false;
  let depth = 0;
  for (const ch of outside) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};
