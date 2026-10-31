/** Test Template component types. Mirrors lims-service `configs/component-types.ts` —
 * separate deployables, keep the two in step. */
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
  | "entityTemplateId";

/** Which extra inputs a row shows after its Type — in this order. */
export const TYPE_FIELDS: Record<ComponentType, TypeField[]> = {
  BLANK: [],
  DESCRIPTION: [],
  TEXT: [],
  VALUE: ["unit", "min", "max"],
  CALCULATION: ["unit", "formula", "min", "max"],
  LIST: ["list", "option"],
  BOOLEAN: ["option"],
  ENTITY: ["entity", "entityTemplateId"],
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
  "entityTemplateId",
  "min",
  "max"
] as const;

/** Pick list of Boolean answer pairs. Each entry's name is "true answer / false answer". */
export const BOOLEAN_ANSWERS_LIST = "BOOLEAN_ANSWERS";

/** "Pass / Fail" → ["Pass", "Fail"]; null unless it is exactly two non-empty answers. */
export const splitBooleanPair = (name: string): [string, string] | null => {
  const parts = name.split("/").map((part) => part.trim());
  return parts.length === 2 && parts[0] && parts[1]
    ? [parts[0], parts[1]]
    : null;
};

/** The tables an Entity component can point at. */
export const COMPONENT_ENTITIES = [
  { value: "INSTRUMENT", label: "Instrument" },
  { value: "STOCK", label: "Stock Item" },
  { value: "STOCK_BATCH", label: "Stock Batch" },
  { value: "LIMS_USER", label: "Lab User" },
  { value: "LOCATION", label: "Storage Location" },
  { value: "SUPPLIER", label: "Supplier" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "LOT", label: "Lot" },
  { value: "BATCH", label: "Batch" }
];

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

/** Row indexes whose Component ID or Name (case-insensitive) repeats another row's. */
export const duplicateRows = (rows: LimsComponentRow[]) => {
  const repeats = (keyOf: (row: LimsComponentRow) => string) => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const key = keyOf(row);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return new Set(
      rows.flatMap((row, i) => ((counts.get(keyOf(row)) ?? 0) > 1 ? [i] : []))
    );
  };
  return {
    ids: repeats((row) => text(row.componentId)),
    names: repeats((row) => text(row.name).toLowerCase())
  };
};

/** Components a Calculation may refer to: the template's other Value/Calculation rows. */
export const formulaTargets = (rows: LimsComponentRow[], selfId: string) =>
  rows
    .filter(isTyped)
    .filter(
      (row) =>
        ["VALUE", "CALCULATION"].includes(row.type) &&
        text(row.componentId) &&
        text(row.componentId) !== selfId
    );

/** What's wrong with a Calculation's formula, or undefined when it is valid. */
export const formulaProblem = (
  formula: string,
  selfId: string,
  rows: LimsComponentRow[]
): string | undefined => {
  if (!formula.trim()) return "Formula is required.";
  if (!isFormulaWellFormed(formula))
    return "the formula may only use numbers, + - * / ( ) and {Component ID}.";
  const targets = new Set(
    formulaTargets(rows, selfId).map((row) => text(row.componentId))
  );
  for (const ref of formulaReferences(formula)) {
    if (ref === selfId) return "a formula can't refer to itself.";
    if (!targets.has(ref))
      return `{${ref}} must be a Value or Calculation component in this template.`;
  }
  return undefined;
};

/** A saved row from before component types existed — shown read-only until given a Type. */
export const isLegacy = (row: LimsComponentRow) =>
  Boolean(row.id) && !isTyped(row);

/** Mirrors the server's checks so the user sees the problem before saving. Returns the
 * first problem found, or undefined when every row is valid. */
export const validateComponentRows = (
  rows: LimsComponentRow[]
): string | undefined => {
  const seen = new Set<string>();
  const seenNames = new Set<string>();

  for (const row of rows) {
    const id = text(row.componentId);
    const name = `"${id || text(row.name) || "new component"}"`;
    if (!id) return "Every component needs a Component ID.";
    if (seen.has(id)) return `Component ID "${id}" is used more than once.`;
    seen.add(id);
    const lowerName = text(row.name).toLowerCase();
    if (lowerName && seenNames.has(lowerName))
      return `Component name "${text(row.name)}" is used more than once.`;
    seenNames.add(lowerName);

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
      const problem = formulaProblem(text(row.formula), id, rows);
      if (problem) return `${name}: ${problem}`;
    }

    if (row.type === "LIST" && !text(row.list)) return `${name}: pick a List.`;
    if (row.type === "BOOLEAN" && !text(row.option))
      return `${name}: pick an answer pair.`;
    if (row.type === "ENTITY") {
      if (!text(row.entity)) return `${name}: pick an Entity.`;
      if (!text(row.entityTemplateId))
        return `${name}: pick an Entity Template.`;
    }
  }
  return undefined;
};
