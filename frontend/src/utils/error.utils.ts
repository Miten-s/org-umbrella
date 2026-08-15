type ErrorLike = {
  error?: unknown;
  message?: unknown;
  errors?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

/** Generic server messages that should be replaced by field-level errors when present. */
const GENERIC = /^(validation failed|bad request|invalid request|error)\.?$/i;

/**
 * Humanize a single field-machine message into something user-facing.
 * e.g. "numberOfLevels must be an integer number" → "Number of levels must be an integer number".
 */
const humanizeOne = (raw: string): string => {
  const trimmed = raw.trim().replace(/^"|"$/g, "");
  const humanized = trimmed.replace(/^([a-zA-Z][a-zA-Z0-9_]*)/, (token) =>
    token
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
};

/** Pull a list of readable messages out of a server `{ errors: [...] }` payload. */
const extractErrorList = (data: unknown): string[] => {
  if (!isRecord(data)) return [];
  const list = (data as ErrorLike).errors;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) return getStringValue(item.message) ?? getStringValue(item.msg);
      return undefined;
    })
    .filter((v): v is string => Boolean(v))
    .map(humanizeOne);
};

/**
 * Single source of truth for turning any error into a user-facing string
 * (MIGRATION.md Rule 3 / S1). Prefers a readable `errors[]` list over a generic
 * `message`, joins/humanizes field-machine messages, never shows a bare
 * "Validation failed".
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (isRecord(error)) {
    const data = isRecord(error.response) ? error.response.data : error;

    const list = extractErrorList(data);
    const topMessage =
      getStringValue((data as ErrorLike | undefined)?.message) ??
      getStringValue((data as ErrorLike | undefined)?.error) ??
      getStringValue((error as ErrorLike).message) ??
      getStringValue((error as ErrorLike).error);

    if (list.length && (!topMessage || GENERIC.test(topMessage))) {
      return list.join("; ");
    }
    if (topMessage) {
      return GENERIC.test(topMessage) && list.length ? list.join("; ") : humanizeOne(topMessage);
    }
    if (list.length) return list.join("; ");
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

/**
 * True for a 403 (authenticated but not allowed). Callers use this to skip
 * offering "Retry" — the request didn't fail, it was correctly refused, and
 * retrying it changes nothing without an admin granting access.
 */
export const isForbiddenError = (error: unknown): boolean =>
  isRecord(error) && isRecord(error.response) && error.response.status === 403;
