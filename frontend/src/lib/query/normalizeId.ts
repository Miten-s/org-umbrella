/**
 * id normalization + `_id` compatibility shim — see STANDARDS.md §3.
 *
 * The backend was migrated to canonical UUID `id`. The frontend historically
 * assumed `_id` (~225 usages). To migrate incrementally without breakage:
 *
 *   - `normalizeId` guarantees a canonical `id` on every row.
 *   - It also keeps `_id === id` populated as a TEMPORARY shim so existing
 *     `_id` reads keep working while a module is migrated.
 *   - As each module moves to the standard, its reads switch to `id`. Once
 *     `grep -rn "_id" src/` is empty, delete the `_id` line below and the
 *     `_id` from the return type. Tracked in MIGRATION.md.
 *
 * Canonical field going forward: `id`.
 */

export type WithId<T> = T & { id: string; _id: string };

const hasIdLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Normalize a single row: ensure canonical `id`, keep `_id` shim in sync. */
export const normalizeId = <T extends Record<string, any>>(row: T): WithId<T> => {
  const id = String(row.id ?? row._id ?? "");
  return { ...row, id, _id: id };
};

/** Normalize a list of rows. */
export const normalizeList = <T extends Record<string, any>>(
  rows: T[] | null | undefined
): WithId<T>[] => (Array.isArray(rows) ? rows.map(normalizeId) : []);

/**
 * Deep-normalize named relation fields on a row (e.g. a user's `location`,
 * `department`, `designation`). Only the listed keys are touched, so unrelated
 * nested data is left alone. Missing/non-object relations pass through unchanged.
 */
export const normalizeIdWithRelations = <T extends Record<string, any>>(
  row: T,
  relationKeys: string[] = []
): WithId<T> => {
  const base = normalizeId(row);
  for (const key of relationKeys) {
    const relation = base[key];
    if (hasIdLike(relation)) {
      (base as Record<string, unknown>)[key] = normalizeId(
        relation as Record<string, any>
      );
    }
  }
  return base;
};
