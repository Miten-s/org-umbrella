/** Evaluates Calculation formulas: numbers, "text", + - * / % comparisons, ( ), {Component ID} and
 * functions such as Avg(). A small parser, not eval. Mirrors lims-service `utils/formula.ts`. */

type Value = number | string | boolean | null;

export class FormulaError extends Error {}

type Node =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "ref"; id: string }
  | { t: "un"; op: string; x: Node }
  | { t: "bin"; op: string; l: Node; r: Node }
  | { t: "call"; name: string; args: Node[] };

type Token =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "ref"; v: string }
  | { k: "id"; v: string }
  | { k: "op"; v: string };

const fail = (message: string): never => {
  throw new FormulaError(message);
};

const TOKEN_RE =
  /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)|"([^"]*)"|'([^']*)'|\{([^{}]+)\}|([A-Za-z_][A-Za-z0-9_]*)|(<=|>=|<>|!=|==|[+\-*/%()<>=,]))/iy;

const tokenize = (formula: string): Token[] => {
  const tokens: Token[] = [];
  let pos = 0;
  while (pos < formula.length) {
    if (/^\s*$/.test(formula.slice(pos))) break;
    TOKEN_RE.lastIndex = pos;
    const m = TOKEN_RE.exec(formula);
    if (!m) return fail("unexpected character in formula");
    if (m[1] !== undefined) tokens.push({ k: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) tokens.push({ k: "str", v: m[2] });
    else if (m[3] !== undefined) tokens.push({ k: "str", v: m[3] });
    else if (m[4] !== undefined) tokens.push({ k: "ref", v: m[4].trim() });
    else if (m[5] !== undefined) tokens.push({ k: "id", v: m[5] });
    else tokens.push({ k: "op", v: m[6] });
    pos = TOKEN_RE.lastIndex;
  }
  return tokens;
};

// ---- Function catalogue -------------------------------------------------------------------

type Impl = (args: Value[]) => Value;
interface FnDef {
  group: string;
  signature: string;
  description: string;
  min: number;
  max: number;
  /** Receives null (a missing input) instead of the whole call turning null. */
  nullable?: boolean;
  run: Impl;
}

const num = (v: Value): number => {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const n = v.trim() === "" ? NaN : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fail("a number was expected");
};
const str = (v: Value): string =>
  v === null ? "" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);
const truthy = (v: Value): boolean =>
  typeof v === "string" ? v.length > 0 : Boolean(v);
const nums = (args: Value[]) => args.map(num);
const finite = (n: number) =>
  Number.isFinite(n) ? n : fail("result is not a finite number");

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) =>
  xs.length ? sum(xs) / xs.length : fail("no values");
const variance = (xs: number[]) => {
  if (xs.length < 2) return fail("at least two values are needed");
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
};
const percentile = (xs: number[], k: number) => {
  if (!xs.length) return fail("no values");
  if (k < 0 || k > 1) return fail("percentile must be between 0 and 1");
  const sorted = [...xs].sort((a, b) => a - b);
  const rank = k * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
};
const split = (xs: number[]): [number[], number[]] => {
  if (xs.length < 2 || xs.length % 2)
    return fail("needs two lists of equal length");
  const half = xs.length / 2;
  return [xs.slice(0, half), xs.slice(half)];
};

/** ">5", "<=3", "=4", "<>0" or a plain number (equals). */
const matcher = (criteria: Value): ((n: number) => boolean) => {
  if (typeof criteria === "number") return (n) => n === criteria;
  const m = /^\s*(<=|>=|<>|!=|==|=|<|>)?\s*(.+?)\s*$/.exec(str(criteria));
  if (!m) return fail("bad condition");
  const limit = Number(m[2]);
  if (!Number.isFinite(limit)) return fail("bad condition");
  switch (m[1]) {
    case "<":
      return (n) => n < limit;
    case "<=":
      return (n) => n <= limit;
    case ">":
      return (n) => n > limit;
    case ">=":
      return (n) => n >= limit;
    case "<>":
    case "!=":
      return (n) => n !== limit;
    default:
      return (n) => n === limit;
  }
};
const filtered = (args: Value[]) => {
  const test = matcher(args[args.length - 1]);
  return nums(args.slice(0, -1)).filter(test);
};

const toDate = (v: Value): Date => {
  const d = new Date(typeof v === "number" ? v : str(v));
  return Number.isNaN(d.getTime()) ? fail("a date was expected") : d;
};
const UNIT_MS: Record<string, number> = {
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000
};
const unitOf = (v: Value | undefined) => str(v ?? "days").toLowerCase();
const monthsBetween = (a: Date, b: Date) => {
  const total =
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  const dayShort = b.getDate() < a.getDate() && total > 0;
  const dayOver = b.getDate() > a.getDate() && total < 0;
  return total - (dayShort ? 1 : 0) + (dayOver ? 1 : 0);
};

const def = (
  group: string,
  signature: string,
  description: string,
  min: number,
  max: number,
  run: Impl,
  nullable = false
): FnDef => ({ group, signature, description, min, max, run, nullable });
const MANY = Number.POSITIVE_INFINITY;

const FUNCTIONS: Record<string, FnDef> = {
  sum: def("Math", "Sum(a, b, …)", "Sum of values", 1, MANY, (a) =>
    sum(nums(a))
  ),
  avg: def("Math", "Avg(a, b, …)", "Average of values", 1, MANY, (a) =>
    mean(nums(a))
  ),
  min: def("Math", "Min(a, b, …)", "Smallest value", 1, MANY, (a) =>
    Math.min(...nums(a))
  ),
  max: def("Math", "Max(a, b, …)", "Largest value", 1, MANY, (a) =>
    Math.max(...nums(a))
  ),
  count: def(
    "Math",
    "Count(a, b, …)",
    "Count numeric values",
    1,
    MANY,
    (a) =>
      a.filter(
        (v) =>
          typeof v === "number" ||
          (typeof v === "string" &&
            v.trim() !== "" &&
            Number.isFinite(Number(v)))
      ).length
  ),
  abs: def("Math", "Abs(x)", "Absolute value", 1, 1, (a) =>
    Math.abs(num(a[0]))
  ),
  round: def("Math", "Round(x, digits)", "Round a number", 1, 2, (a) => {
    const f = 10 ** (a[1] === undefined ? 0 : num(a[1]));
    const x = num(a[0]);
    return (
      (Math.sign(x) * Math.round(Number((Math.abs(x) * f).toPrecision(15)))) / f
    );
  }),
  ceil: def("Math", "Ceil(x)", "Round upward", 1, 1, (a) =>
    Math.ceil(num(a[0]))
  ),
  floor: def("Math", "Floor(x)", "Round downward", 1, 1, (a) =>
    Math.floor(num(a[0]))
  ),
  pow: def("Math", "Pow(x, y)", "Power", 2, 2, (a) =>
    finite(num(a[0]) ** num(a[1]))
  ),
  sqrt: def("Math", "Sqrt(x)", "Square root", 1, 1, (a) =>
    finite(Math.sqrt(num(a[0])))
  ),
  mod: def("Math", "Mod(x, y)", "Remainder", 2, 2, (a) => {
    const d = num(a[1]);
    return d === 0 ? fail("division by zero") : ((num(a[0]) % d) + d) % d;
  }),

  sin: def("Scientific", "Sin(x)", "Sine (radians)", 1, 1, (a) =>
    Math.sin(num(a[0]))
  ),
  cos: def("Scientific", "Cos(x)", "Cosine (radians)", 1, 1, (a) =>
    Math.cos(num(a[0]))
  ),
  tan: def("Scientific", "Tan(x)", "Tangent (radians)", 1, 1, (a) =>
    finite(Math.tan(num(a[0])))
  ),
  asin: def("Scientific", "Asin(x)", "Inverse sine", 1, 1, (a) =>
    finite(Math.asin(num(a[0])))
  ),
  acos: def("Scientific", "Acos(x)", "Inverse cosine", 1, 1, (a) =>
    finite(Math.acos(num(a[0])))
  ),
  atan: def("Scientific", "Atan(x)", "Inverse tangent", 1, 1, (a) =>
    Math.atan(num(a[0]))
  ),
  log: def(
    "Scientific",
    "Log(x, base)",
    "Logarithm (base 10 by default)",
    1,
    2,
    (a) =>
      finite(
        Math.log(num(a[0])) / Math.log(a[1] === undefined ? 10 : num(a[1]))
      )
  ),
  log10: def("Scientific", "Log10(x)", "Base-10 logarithm", 1, 1, (a) =>
    finite(Math.log10(num(a[0])))
  ),
  ln: def("Scientific", "Ln(x)", "Natural logarithm", 1, 1, (a) =>
    finite(Math.log(num(a[0])))
  ),
  exp: def("Scientific", "Exp(x)", "e raised to x", 1, 1, (a) =>
    finite(Math.exp(num(a[0])))
  ),
  factorial: def(
    "Scientific",
    "Factorial(n)",
    "Factorial of a whole number",
    1,
    1,
    (a) => {
      const n = num(a[0]);
      if (!Number.isInteger(n) || n < 0 || n > 170)
        return fail("invalid factorial input");
      let r = 1;
      for (let i = 2; i <= n; i += 1) r *= i;
      return r;
    }
  ),
  sign: def("Scientific", "Sign(x)", "-1, 0 or 1", 1, 1, (a) =>
    Math.sign(num(a[0]))
  ),
  trunc: def(
    "Scientific",
    "Trunc(x, digits)",
    "Drop decimal digits",
    1,
    2,
    (a) => {
      const f = 10 ** (a[1] === undefined ? 0 : num(a[1]));
      return Math.trunc(num(a[0]) * f) / f;
    }
  ),

  median: def("Statistical", "Median(a, b, …)", "Middle value", 1, MANY, (a) =>
    percentile(nums(a), 0.5)
  ),
  mode: def(
    "Statistical",
    "Mode(a, b, …)",
    "Most frequent value",
    1,
    MANY,
    (a) => {
      const counts = new Map<number, number>();
      for (const x of nums(a)) counts.set(x, (counts.get(x) ?? 0) + 1);
      const top = Math.max(...counts.values());
      return Math.min(
        ...[...counts].filter(([, c]) => c === top).map(([x]) => x)
      );
    }
  ),
  stddev: def(
    "Statistical",
    "StdDev(a, b, …)",
    "Sample standard deviation",
    2,
    MANY,
    (a) => Math.sqrt(variance(nums(a)))
  ),
  variance: def(
    "Statistical",
    "Variance(a, b, …)",
    "Sample variance",
    2,
    MANY,
    (a) => variance(nums(a))
  ),
  percentile: def(
    "Statistical",
    "Percentile(a, b, …, k)",
    "Value at k (0 to 1)",
    2,
    MANY,
    (a) => percentile(nums(a.slice(0, -1)), num(a[a.length - 1]))
  ),
  quartile: def(
    "Statistical",
    "Quartile(a, b, …, q)",
    "Quartile q (0 to 4)",
    2,
    MANY,
    (a) => {
      const q = num(a[a.length - 1]);
      return Number.isInteger(q) && q >= 0 && q <= 4
        ? percentile(nums(a.slice(0, -1)), q / 4)
        : fail("quartile must be 0 to 4");
    }
  ),
  rank: def(
    "Statistical",
    "Rank(x, a, b, …)",
    "Rank of x, 1 = largest",
    2,
    MANY,
    (a) => {
      const x = num(a[0]);
      return nums(a.slice(1)).filter((v) => v > x).length + 1;
    }
  ),
  distinctcount: def(
    "Statistical",
    "DistinctCount(a, b, …)",
    "Count unique values",
    1,
    MANY,
    (a) => new Set(a.map(str)).size
  ),
  weightedavg: def(
    "Statistical",
    "WeightedAvg(v1, …, w1, …)",
    "Values then equal-length weights",
    2,
    MANY,
    (a) => {
      const [v, w] = split(nums(a));
      const total = sum(w);
      return total === 0
        ? fail("weights sum to zero")
        : sum(v.map((x, i) => x * w[i])) / total;
    }
  ),
  correlation: def(
    "Statistical",
    "Correlation(x1, …, y1, …)",
    "Two equal-length lists",
    4,
    MANY,
    (a) => {
      const [x, y] = split(nums(a));
      const mx = mean(x);
      const my = mean(y);
      const cov = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
      const d = Math.sqrt(
        sum(x.map((v) => (v - mx) ** 2)) * sum(y.map((v) => (v - my) ** 2))
      );
      return d === 0 ? fail("no variation") : cov / d;
    }
  ),

  if: def(
    "Logical",
    "If(condition, then, else)",
    "Pick a result by condition",
    3,
    3,
    (a) => (truthy(a[0]) ? a[1] : a[2])
  ),
  and: def("Logical", "And(a, b, …)", "All conditions true", 1, MANY, (a) =>
    a.every(truthy)
  ),
  or: def("Logical", "Or(a, b, …)", "Any condition true", 1, MANY, (a) =>
    a.some(truthy)
  ),
  not: def(
    "Logical",
    "Not(x)",
    "Reverse a condition",
    1,
    1,
    (a) => !truthy(a[0])
  ),
  iferror: def(
    "Logical",
    "IfError(x, fallback)",
    "Fallback on error",
    2,
    2,
    (a) => a[0],
    true
  ),
  isnull: def(
    "Logical",
    "IsNull(x)",
    "Is the input missing",
    1,
    1,
    (a) => a[0] === null,
    true
  ),
  coalesce: def(
    "Logical",
    "Coalesce(a, b, …)",
    "First input that is present",
    1,
    MANY,
    (a) => a.find((v) => v !== null) ?? null,
    true
  ),
  sumif: def(
    "Logical",
    "SumIf(a, b, …, condition)",
    'Sum of values matching e.g. ">5"',
    2,
    MANY,
    (a) => sum(filtered(a))
  ),
  countif: def(
    "Logical",
    "CountIf(a, b, …, condition)",
    "Count of values matching",
    2,
    MANY,
    (a) => filtered(a).length
  ),
  avgif: def(
    "Logical",
    "AvgIf(a, b, …, condition)",
    "Average of values matching",
    2,
    MANY,
    (a) => mean(filtered(a))
  ),

  now: def("Date", "Now()", "Current date and time", 0, 0, () => Date.now()),
  today: def("Date", "Today()", "Today's date", 0, 0, () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }),
  year: def("Date", "Year(date)", "Year of a date", 1, 1, (a) =>
    toDate(a[0]).getFullYear()
  ),
  month: def(
    "Date",
    "Month(date)",
    "Month of a date (1–12)",
    1,
    1,
    (a) => toDate(a[0]).getMonth() + 1
  ),
  day: def("Date", "Day(date)", "Day of the month", 1, 1, (a) =>
    toDate(a[0]).getDate()
  ),
  datediff: def(
    "Date",
    "DateDiff(from, to, unit)",
    "to − from in days (default), hours, months…",
    2,
    3,
    (a) => {
      const [from, to] = [toDate(a[0]), toDate(a[1])];
      const unit = unitOf(a[2]);
      if (unit === "months") return monthsBetween(from, to);
      if (unit === "years") return Math.trunc(monthsBetween(from, to) / 12);
      return UNIT_MS[unit]
        ? (to.getTime() - from.getTime()) / UNIT_MS[unit]
        : fail("unknown unit");
    }
  ),
  dateadd: def(
    "Date",
    "DateAdd(date, amount, unit)",
    "Add time to a date",
    2,
    3,
    (a) => {
      const d = toDate(a[0]);
      const n = num(a[1]);
      const unit = unitOf(a[2]);
      if (unit === "months") d.setMonth(d.getMonth() + n);
      else if (unit === "years") d.setFullYear(d.getFullYear() + n);
      else if (UNIT_MS[unit]) d.setTime(d.getTime() + n * UNIT_MS[unit]);
      else return fail("unknown unit");
      return d.getTime();
    }
  ),
  daysbetween: def(
    "Date",
    "DaysBetween(a, b)",
    "Whole days between two dates",
    2,
    2,
    (a) =>
      Math.round(
        Math.abs(toDate(a[1]).getTime() - toDate(a[0]).getTime()) / UNIT_MS.days
      )
  ),

  concat: def("Text", "Concat(a, b, …)", "Join text", 1, MANY, (a) =>
    a.map(str).join("")
  ),
  upper: def("Text", "Upper(text)", "Uppercase", 1, 1, (a) =>
    str(a[0]).toUpperCase()
  ),
  lower: def("Text", "Lower(text)", "Lowercase", 1, 1, (a) =>
    str(a[0]).toLowerCase()
  ),
  trim: def("Text", "Trim(text)", "Remove surrounding spaces", 1, 1, (a) =>
    str(a[0]).trim()
  ),
  length: def(
    "Text",
    "Length(text)",
    "Number of characters",
    1,
    1,
    (a) => str(a[0]).length
  ),
  replace: def("Text", "Replace(text, find, with)", "Replace text", 3, 3, (a) =>
    str(a[0]).split(str(a[1])).join(str(a[2]))
  ),
  contains: def(
    "Text",
    "Contains(text, part)",
    "Does text hold part",
    2,
    2,
    (a) => str(a[0]).includes(str(a[1]))
  ),
  substring: def(
    "Text",
    "Substring(text, start, length)",
    "Part of text (start at 1)",
    2,
    3,
    (a) => {
      const from = Math.max(num(a[1]) - 1, 0);
      return a[2] === undefined
        ? str(a[0]).slice(from)
        : str(a[0]).slice(from, from + num(a[2]));
    }
  )
};

const CONSTANTS: Record<string, number | boolean> = {
  true: true,
  false: false,
  pi: Math.PI,
  e: Math.E
};

/** Every function the formula builder offers, in menu order. */
export const FORMULA_FUNCTIONS = Object.entries(FUNCTIONS).map(([key, fn]) => ({
  name: fn.signature.slice(0, fn.signature.indexOf("(")),
  key,
  group: fn.group,
  signature: fn.signature,
  description: fn.description
}));

// ---- Parser ---------------------------------------------------------------------------------

const parse = (formula: string): Node => {
  const tokens = tokenize(formula);
  if (!tokens.length) return fail("formula is empty");
  let i = 0;
  const isOp = (...ops: string[]) => {
    const t = tokens[i];
    return t?.k === "op" && ops.includes(t.v);
  };
  const expect = (op: string) => {
    if (!isOp(op)) fail(`expected "${op}"`);
    i += 1;
  };

  const primary = (): Node => {
    const t = tokens[i++];
    if (!t) return fail("formula ends too early");
    if (t.k === "num") return { t: "num", v: t.v };
    if (t.k === "str") return { t: "str", v: t.v };
    if (t.k === "ref") return { t: "ref", id: t.v };
    if (t.k === "id") {
      const name = t.v.toLowerCase();
      if (isOp("(")) {
        const fn = FUNCTIONS[name];
        if (!fn) return fail(`unknown function ${t.v}`);
        i += 1;
        const args: Node[] = [];
        if (!isOp(")")) {
          args.push(comparison());
          while (isOp(",")) {
            i += 1;
            args.push(comparison());
          }
        }
        expect(")");
        if (args.length < fn.min || args.length > fn.max)
          return fail(`${t.v}() has the wrong number of values`);
        return { t: "call", name, args };
      }
      if (name in CONSTANTS) {
        const v = CONSTANTS[name];
        return typeof v === "boolean" ? { t: "bool", v } : { t: "num", v };
      }
      return fail(`unknown name ${t.v}`);
    }
    if (t.v === "-" || t.v === "+") return { t: "un", op: t.v, x: unary() };
    if (t.v === "(") {
      const inner = comparison();
      expect(")");
      return inner;
    }
    return fail(`unexpected "${t.v}"`);
  };
  const unary = (): Node => primary();
  const binary = (next: () => Node, ops: string[]) => () => {
    let left = next();
    while (isOp(...ops)) {
      const op = (tokens[i++] as { v: string }).v;
      left = { t: "bin", op, l: left, r: next() };
    }
    return left;
  };
  const term = binary(unary, ["*", "/", "%"]);
  const additive = binary(term, ["+", "-"]);
  const comparison: () => Node = binary(additive, [
    "<",
    "<=",
    ">",
    ">=",
    "=",
    "==",
    "<>",
    "!="
  ]);

  const root = comparison();
  if (i !== tokens.length) return fail("unexpected text after the formula");
  return root;
};

/** True when the formula parses: known functions, right argument counts, balanced brackets. */
export const formulaSyntaxProblem = (formula: string): string | undefined => {
  try {
    parse(formula);
    return undefined;
  } catch (error) {
    return error instanceof FormulaError ? error.message : "invalid formula";
  }
};

// ---- Evaluation -----------------------------------------------------------------------------

const compare = (op: string, l: Value, r: Value): boolean => {
  const bothText = typeof l === "string" && typeof r === "string";
  const a = bothText ? l : num(l);
  const b = bothText ? r : num(r);
  switch (op) {
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "<>":
    case "!=":
      return a !== b;
    default:
      return a === b;
  }
};

const evaluate = (
  node: Node,
  valueOf: (id: string) => number | null
): Value => {
  switch (node.t) {
    case "num":
    case "str":
    case "bool":
      return node.v;
    case "ref":
      return valueOf(node.id);
    case "un": {
      const x = evaluate(node.x, valueOf);
      return x === null ? null : node.op === "-" ? -num(x) : num(x);
    }
    case "bin": {
      const l = evaluate(node.l, valueOf);
      const r = evaluate(node.r, valueOf);
      if (l === null || r === null) return null;
      if (["<", "<=", ">", ">=", "=", "==", "<>", "!="].includes(node.op))
        return compare(node.op, l, r);
      const a = num(l);
      const b = num(r);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      if (b === 0) return fail("division by zero");
      return node.op === "/" ? a / b : a % b;
    }
    case "call": {
      if (node.name === "iferror") {
        try {
          const v = evaluate(node.args[0], valueOf);
          return v === null ? evaluate(node.args[1], valueOf) : v;
        } catch (error) {
          if (error instanceof FormulaError)
            return evaluate(node.args[1], valueOf);
          throw error;
        }
      }
      if (node.name === "if") {
        const cond = evaluate(node.args[0], valueOf);
        if (cond === null) return null;
        return evaluate(node.args[truthy(cond) ? 1 : 2], valueOf);
      }
      const fn = FUNCTIONS[node.name];
      const args = node.args.map((arg) => evaluate(arg, valueOf));
      if (!fn.nullable && args.includes(null)) return null;
      return fn.run(args);
    }
  }
};

/** null when the formula is malformed, an input is missing, or it can't be calculated. */
export const evaluateFormula = (
  formula: string,
  valueOf: (id: string) => number | null
): number | null => {
  try {
    const result = evaluate(parse(formula), valueOf);
    if (typeof result === "boolean") return result ? 1 : 0;
    return typeof result === "number" && Number.isFinite(result)
      ? result
      : null;
  } catch (error) {
    if (error instanceof FormulaError) return null;
    throw error;
  }
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
