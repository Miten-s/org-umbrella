/**
 * Cheap structural equality for LIMS form payloads (primitives, arrays of
 * primitives, and one level of nested plain objects — the shapes form values
 * actually take). Used once, on submit, to compare the edited record's
 * current values against its original ones — never run across a list, so
 * cost is bounded by one record's field count regardless of table size.
 */
export function isPayloadEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }
  if (typeof a !== "object" || typeof b !== "object") return a === b;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => isPayloadEqual(item, b[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => isPayloadEqual(aObj[key], bObj[key]));
}
