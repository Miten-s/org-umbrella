import { ModelStatic, Model, Op } from "sequelize";

/**
 * `filter[field]=value` (spec §3, NFR-7/8) only ever reaches a `WHERE` clause
 * for columns that actually exist on the model — never pass a raw client
 * object straight into `where`.
 */
export const getSafeFilters = (
  model: ModelStatic<Model>,
  filters: Record<string, string> = {}
): Record<string, unknown> => {
  const attributes = Object.keys(model.getAttributes());
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (!attributes.includes(key) || value === undefined || value === "") continue;
    safe[key] = value;
  }

  return safe;
};

/** Case-insensitive contains, for the free-text `search` param. */
export const ilike = (value: string) => ({ [Op.iLike]: `%${value}%` });
