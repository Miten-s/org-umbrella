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
  ENTITY: ["entity", "entityTemplateId"],
  DATETIME: []
};

export const TYPE_SPECIFIC_FIELDS = [
  "unit",
  "calculation",
  "formula",
  "option",
  "list",
  "entity",
  "entityTemplateId",
  "min",
  "max"
];

/** Pick list of Boolean answer pairs. Each entry's name is "true answer / false answer". */
export const BOOLEAN_ANSWERS_PHRASE = "BOOLEAN_ANSWERS";

/** "Pass / Fail" → ["Pass", "Fail"]; null unless it is exactly two non-empty answers. */
export const splitBooleanPair = (name: string): [string, string] | null => {
  const parts = name.split("/").map((part) => part.trim());
  return parts.length === 2 && parts[0] && parts[1]
    ? [parts[0], parts[1]]
    : null;
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
