/** Shapes a Sequelize instance into what the frontend's `listAdapter` expects (STANDARDS.md
 * §3): `id` canonical, `isDeleted` -> `isRemoved`, `updatedAt` -> `modifiedOn`. Applied recursively. */
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
