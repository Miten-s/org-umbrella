/** Checks a result against its component type and Specification limit. Mirrors
 * lims-service `utils/result-check.ts` — keep in step. */

export interface ResultLimit {
  min?: unknown;
  max?: unknown;
  text?: unknown;
  phrase?: unknown;
  boolean?: unknown;
}

export type ResultStatus = "Unentered" | "Pass" | "Fail" | "Report";

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const isNumeric = (value: string) =>
  value !== "" && Number.isFinite(Number(value));

/** A real date, with an optional real time: YYYY-MM-DD[THH:mm]. */
const isRealDateTime = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    Number(m[4] ?? 0) < 24 &&
    Number(m[5] ?? 0) < 60
  );
};

/** A wrong type can't be saved. Only Value is numeric-only; Text takes letters and numbers. */
export const typeProblem = (
  type: string | null | undefined,
  value: unknown
): string | null => {
  const entered = text(value);
  if (!entered) return null;
  if (type === "VALUE" && !isNumeric(entered))
    return `"${entered}" is not a number.`;
  if (type === "DATETIME" && !isRealDateTime(entered))
    return `"${entered}" is not a valid date and time.`;
  return null;
};

/** Why a value misses its limit, or null when it meets it or nothing is checkable. */
export const limitProblem = (
  type: string | null | undefined,
  limit: ResultLimit,
  value: unknown
): string | null => {
  const entered = text(value);
  if (!entered) return null;
  if (type === "VALUE" || type === "CALCULATION") {
    const min = text(limit.min);
    const max = text(limit.max);
    if (min && Number(entered) < Number(min))
      return `${entered} is below the minimum ${min}.`;
    if (max && Number(entered) > Number(max))
      return `${entered} is above the maximum ${max}.`;
    return null;
  }
  const expected = text(
    type === "TEXT"
      ? limit.text
      : type === "LIST"
        ? limit.phrase
        : type === "BOOLEAN"
          ? limit.boolean
          : ""
  );
  return expected && entered.toLowerCase() !== expected.toLowerCase()
    ? "This is not the expected answer."
    : null;
};

/** Whether this limit actually constrains this type. */
export const hasLimit = (
  type: string | null | undefined,
  limit: ResultLimit
) =>
  type === "VALUE" || type === "CALCULATION"
    ? Boolean(text(limit.min) || text(limit.max))
    : Boolean(
        text(
          type === "TEXT"
            ? limit.text
            : type === "LIST"
              ? limit.phrase
              : type === "BOOLEAN"
                ? limit.boolean
                : ""
        )
      );

/** Unentered without a value; Pass/Fail against a limit; Report when there is nothing to judge
 * it by (no Specification, or no limits). The status never stops a value being saved. */
export const statusOf = (
  type: string | null | undefined,
  limit: ResultLimit | undefined,
  value: unknown
): ResultStatus => {
  if (!text(value)) return "Unentered";
  if (!limit || !hasLimit(type, limit)) return "Report";
  return limitProblem(type, limit, value) ? "Fail" : "Pass";
};
