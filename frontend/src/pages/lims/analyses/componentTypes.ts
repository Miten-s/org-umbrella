/** Test Template component types. Mirrors lims-service `configs/component-types.ts` —
 * separate deployables, keep the two in step. */
import type { useAsyncOptions } from "@/hooks/useAsyncOptions";
import {
  useInstrumentStatusOptions,
  useInstrumentTypeOptions,
  useLocationTypeOptions,
  useMeasurementTypeOptions,
  useRatingOptions,
  useStockBatchStatusOptions,
  useStockTypeOptions
} from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsStockOptions } from "@/pages/lims/stocks/LimsStock.queries";
import { useLimsBatchOptions } from "@/pages/lims/batches/LimsBatch.queries";
import type { LimsComponentRow } from "./LimsAnalysis.types";

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

export const TYPE_LABELS: Record<ComponentType, string> = {
  BLANK: "Blank",
  DESCRIPTION: "Description",
  TEXT: "Text",
  VALUE: "Value",
  CALCULATION: "Calculation",
  LIST: "List",
  BOOLEAN: "Boolean",
  ENTITY: "Entity",
  DATETIME: "Datetime"
};

export type TypeField =
  | "unit"
  | "formula"
  | "min"
  | "max"
  | "list"
  | "option"
  | "entity"
  | "entityCriteria";

/** Which extra inputs a row shows after its Type — in this order. */
export const TYPE_FIELDS: Record<ComponentType, TypeField[]> = {
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

/** Every type-specific column — cleared when a row's Type changes. */
export const TYPE_SPECIFIC_KEYS = [
  "unit",
  "calculation",
  "formula",
  "option",
  "list",
  "entity",
  "entityCriteria",
  "min",
  "max"
] as const;

export const BOOLEAN_OPTIONS = [
  { value: "YES_NO", label: "Yes / No" },
  { value: "PASS_FAIL", label: "Pass / Fail" },
  { value: "COMPLIES", label: "Complies / Does not comply" },
  { value: "PRESENT_ABSENT", label: "Present / Absent" }
];

type OptionsHook = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) => ReturnType<typeof useAsyncOptions>;

export interface CriteriaField {
  field: string;
  label: string;
  useOptions: OptionsHook;
}

export interface ComponentEntity {
  value: string;
  label: string;
  criteria: CriteriaField[];
}

const labGroup: CriteriaField = {
  field: "groupId",
  label: "Lab Group",
  useOptions: useLimsGroupOptions
};

export const COMPONENT_ENTITIES: ComponentEntity[] = [
  {
    value: "INSTRUMENT",
    label: "Instrument",
    criteria: [
      { field: "typeId", label: "Type", useOptions: useInstrumentTypeOptions },
      {
        field: "measurementTypeId",
        label: "Measurement type",
        useOptions: useMeasurementTypeOptions
      },
      {
        field: "statusId",
        label: "Status",
        useOptions: useInstrumentStatusOptions
      },
      {
        field: "locationId",
        label: "Location",
        useOptions: useLimsLocationOptions
      },
      labGroup
    ]
  },
  {
    value: "STOCK",
    label: "Stock Item",
    criteria: [
      {
        field: "stockTypeId",
        label: "Stock type",
        useOptions: useStockTypeOptions
      },
      labGroup
    ]
  },
  {
    value: "STOCK_BATCH",
    label: "Stock Batch",
    criteria: [
      {
        field: "statusId",
        label: "Status",
        useOptions: useStockBatchStatusOptions
      },
      {
        field: "stockId",
        label: "Stock Item",
        useOptions: useLimsStockOptions
      },
      labGroup
    ]
  },
  {
    value: "LIMS_USER",
    label: "Lab User",
    criteria: [
      labGroup,
      {
        field: "locationId",
        label: "Location",
        useOptions: useLimsLocationOptions
      }
    ]
  },
  {
    value: "LOCATION",
    label: "Storage Location",
    criteria: [
      {
        field: "locationTypeId",
        label: "Location type",
        useOptions: useLocationTypeOptions
      },
      labGroup
    ]
  },
  {
    value: "SUPPLIER",
    label: "Supplier",
    criteria: [
      { field: "ratingId", label: "Rating", useOptions: useRatingOptions },
      labGroup
    ]
  },
  {
    value: "CUSTOMER",
    label: "Customer",
    criteria: [
      { field: "ratingId", label: "Rating", useOptions: useRatingOptions },
      labGroup
    ]
  },
  {
    value: "LOT",
    label: "Lot",
    criteria: [
      { field: "batchId", label: "Batch", useOptions: useLimsBatchOptions },
      labGroup
    ]
  },
  { value: "BATCH", label: "Batch", criteria: [labGroup] }
];

/** Stored in `entityCriteria` as JSON; `label` is kept only so the cell can show it. */
export interface EntityCriteria {
  field: string;
  value: string;
  label?: string;
}

export const parseCriteria = (raw: unknown): EntityCriteria | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.field === "string" ? parsed : null;
  } catch {
    return null;
  }
};

export const isTyped = (
  row: LimsComponentRow
): row is LimsComponentRow & { type: ComponentType } =>
  (COMPONENT_TYPES as readonly string[]).includes(String(row.type ?? ""));

/** `{TITRE} * {FACTOR}` → ["TITRE", "FACTOR"]. */
export const formulaReferences = (formula: string): string[] =>
  [...formula.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1].trim());

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

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

/** A saved row from before component types existed — shown read-only until given a Type. */
export const isLegacy = (row: LimsComponentRow) =>
  Boolean(row.id) && !isTyped(row);

/** Mirrors the server's checks so the user sees the problem before saving. Returns the
 * first problem found, or undefined when every row is valid. */
export const validateComponentRows = (
  rows: LimsComponentRow[]
): string | undefined => {
  const typed = rows.filter(isTyped);
  const byId = new Map(typed.map((row) => [text(row.componentId), row]));
  const seen = new Set<string>();

  for (const row of rows) {
    const id = text(row.componentId);
    const name = `"${id || text(row.name) || "new component"}"`;
    if (!id) return "Every component needs a Component ID.";
    if (seen.has(id)) return `Component ID "${id}" is used more than once.`;
    seen.add(id);

    if (isLegacy(row)) continue;
    if (!isTyped(row)) return `${name}: pick a Type.`;
    if (!text(row.name)) return `${name}: Name is required.`;
    if (!text(row.description)) return `${name}: Description is required.`;

    if (row.type === "VALUE" || row.type === "CALCULATION") {
      for (const field of ["min", "max"] as const) {
        const value = text(row[field]);
        if (value && Number.isNaN(Number(value)))
          return `${name}: ${field === "min" ? "Min" : "Max"} must be a number.`;
      }
      if (text(row.min) && text(row.max) && Number(row.min) > Number(row.max))
        return `${name}: Min can't be greater than Max.`;
    }

    if (row.type === "CALCULATION") {
      const formula = text(row.formula);
      if (!formula) return `${name}: Formula is required.`;
      if (!isFormulaWellFormed(formula))
        return `${name}: the formula may only use numbers, + - * / ( ) and {Component ID}.`;
      for (const ref of formulaReferences(formula)) {
        if (ref === id) return `${name}: a formula can't refer to itself.`;
        const target = byId.get(ref);
        if (!target || !["VALUE", "CALCULATION"].includes(target.type))
          return `${name}: {${ref}} must be a Value or Calculation component in this template.`;
      }
    }

    if (row.type === "LIST" && !text(row.list)) return `${name}: pick a List.`;
    if (row.type === "BOOLEAN" && !text(row.option))
      return `${name}: pick an answer pair.`;
    if (row.type === "ENTITY") {
      if (!text(row.entity)) return `${name}: pick an Entity.`;
      const criteria = parseCriteria(row.entityCriteria);
      if (criteria && !criteria.value)
        return `${name}: pick a value for the criteria, or clear it.`;
    }
  }
  return undefined;
};
