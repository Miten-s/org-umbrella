import type {
  CatalogTable,
  QueryGroup,
  QueryNode,
  QueryRule
} from "./LimsEntityTemplate.types";

export const OPERATOR_LABELS: Record<string, string> = {
  "=": "is",
  "!=": "is not",
  contains: "contains",
  ">": ">",
  ">=": "≥",
  "<": "<",
  "<=": "≤",
  before: "before",
  after: "after"
};

export const emptyQuery = (): QueryGroup => ({ combinator: "and", rules: [] });

export const emptyRule = (): QueryRule => ({
  field: "",
  operator: "",
  value: ""
});

export const isGroup = (node: QueryNode): node is QueryGroup =>
  Array.isArray((node as QueryGroup).rules);

/** The first thing the server would reject, in the user's words. */
export const queryProblem = (
  query: QueryGroup,
  table: CatalogTable | undefined
): string | undefined => {
  for (const node of query.rules) {
    if (isGroup(node)) {
      const problem = queryProblem(node, table);
      if (problem) return problem;
      continue;
    }
    const field = table?.fields.find((f) => f.key === node.field);
    if (!field || !node.operator) return "Pick a field for every rule.";
    if (!String(node.value ?? "").trim())
      return `${field.label}: enter a value.`;
    if (field.type === "number" && !Number.isFinite(Number(node.value)))
      return `${field.label}: enter a number.`;
  }
  return undefined;
};
