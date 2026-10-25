/** Evaluates Calculation formulas: numbers, + - * / ( ) and {Component ID}. A small parser
 * rather than eval. Mirrored in the frontend's `pages/lims/analyses/formula.ts` — keep in step. */

type Token =
  | { kind: "num"; value: number }
  | { kind: "ref"; id: string }
  | { kind: "op"; op: string };

const tokenize = (formula: string): Token[] | null => {
  const tokens: Token[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|\{([^{}]+)\}|([+\-*/()]))/y;
  let pos = 0;
  while (pos < formula.length) {
    if (/^\s*$/.test(formula.slice(pos))) break;
    re.lastIndex = pos;
    const m = re.exec(formula);
    if (!m) return null;
    if (m[1] !== undefined) tokens.push({ kind: "num", value: Number(m[1]) });
    else if (m[2] !== undefined) tokens.push({ kind: "ref", id: m[2].trim() });
    else tokens.push({ kind: "op", op: m[3] });
    pos = re.lastIndex;
  }
  return tokens;
};

/** null when the formula is malformed, an input is missing, or it divides by zero. */
export const evaluateFormula = (
  formula: string,
  valueOf: (id: string) => number | null
): number | null => {
  const tokens = tokenize(formula);
  if (!tokens?.length) return null;
  let i = 0;
  const peek = () => tokens[i];
  const isOp = (op: string) => {
    const t = peek();
    return t?.kind === "op" && t.op === op;
  };

  const factor = (): number | null => {
    const t = tokens[i++];
    if (!t) return null;
    if (t.kind === "num") return t.value;
    if (t.kind === "ref") return valueOf(t.id);
    if (t.op === "-") {
      const v = factor();
      return v === null ? null : -v;
    }
    if (t.op === "+") return factor();
    if (t.op === "(") {
      const v = expr();
      if (!isOp(")")) return null;
      i += 1;
      return v;
    }
    return null;
  };

  const term = (): number | null => {
    let left = factor();
    while (left !== null && (isOp("*") || isOp("/"))) {
      const op = (tokens[i++] as { op: string }).op;
      const right = factor();
      if (right === null || (op === "/" && right === 0)) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };

  const expr = (): number | null => {
    let left = term();
    while (left !== null && (isOp("+") || isOp("-"))) {
      const op = (tokens[i++] as { op: string }).op;
      const right = term();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };

  const result = expr();
  return i === tokens.length && result !== null && Number.isFinite(result)
    ? result
    : null;
};

/** 10 significant digits, so float noise (0.1 + 0.2) doesn't reach the result. */
export const formatResult = (value: number) =>
  String(Number(value.toPrecision(10)));

const toNumber = (value: unknown): number | null => {
  const text =
    value === null || value === undefined ? "" : String(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

export interface CalcRow {
  componentId?: string | null;
  componentType?: string | null;
  componentFormula?: string | null;
  value?: unknown;
}

/** Every Calculation row's value from one test's rows, Calculations of Calculations included.
 * Keyed by component ID; "" when it can't be computed yet. */
export const computeCalculations = (rows: CalcRow[]): Map<string, string> => {
  const byId = new Map(rows.map((row) => [String(row.componentId ?? ""), row]));
  const memo = new Map<string, number | null>();
  const visiting = new Set<string>();

  const valueOf = (id: string): number | null => {
    const row = byId.get(id);
    if (!row) return null;
    if (row.componentType !== "CALCULATION") return toNumber(row.value);
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return null;
    visiting.add(id);
    const result = evaluateFormula(String(row.componentFormula ?? ""), valueOf);
    visiting.delete(id);
    memo.set(id, result);
    return result;
  };

  const out = new Map<string, string>();
  for (const row of rows)
    if (row.componentType === "CALCULATION") {
      const id = String(row.componentId ?? "");
      const result = valueOf(id);
      out.set(id, result === null ? "" : formatResult(result));
    }
  return out;
};
