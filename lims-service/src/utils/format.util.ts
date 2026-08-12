/**
 * Shapes a Sequelize instance (or plain object / array / findAndCountAll
 * result) into what the frontend's `listAdapter` expects (STANDARDS.md §3):
 *  - `id` is canonical; `_id` is kept as a compatibility shim.
 *  - `isDeleted` -> `isRemoved` (frontend never reads the DB column name).
 *  - `updatedAt` -> `modifiedOn`, `createdAt` stays as-is.
 * Applied recursively so eager-loaded relations come back nested and shaped
 * the same way, never as bare UUIDs.
 */
export const formatLimsEntity = (entity: any): any => {
  if (entity === null || entity === undefined) return entity;

  if (Array.isArray(entity)) {
    return entity.map(formatLimsEntity);
  }

  // findAndCountAll result shape.
  if (entity.rows !== undefined && entity.count !== undefined && Array.isArray(entity.rows)) {
    return { count: entity.count, rows: entity.rows.map(formatLimsEntity) };
  }

  const json = typeof entity.toJSON === "function" ? entity.toJSON() : { ...entity };

  if (json.id !== undefined) {
    json._id = json.id;
  }

  if (json.updatedAt !== undefined) {
    json.modifiedOn = json.updatedAt;
    delete json.updatedAt;
  }

  if (json.isDeleted !== undefined) {
    json.isRemoved = json.isDeleted;
    delete json.isDeleted;
  }

  for (const key in json) {
    if (!Object.prototype.hasOwnProperty.call(json, key)) continue;
    const value = json[key];
    if (value && typeof value === "object" && !(value instanceof Date)) {
      json[key] = formatLimsEntity(value);
    }
  }

  return json;
};
