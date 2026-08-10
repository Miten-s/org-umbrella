export const formatLimsEntity = (entity: any): any => {
  if (!entity) return null;
    if (Array.isArray(entity)) {
    return entity.map(formatLimsEntity);
  }

  // Intercept findAndCountAll responses
  if (entity.rows !== undefined && entity.count !== undefined && Array.isArray(entity.rows)) {
    return {
      count: entity.count,
      rows: entity.rows.map(formatLimsEntity)
    };
  }

  // If it's a Sequelize model instance, call toJSON()
  let json = typeof entity.toJSON === "function" ? entity.toJSON() : { ...entity };

  // Map id -> _id
  if (json.id) {
    json._id = json.id;
  }

  // Map updatedAt -> modifiedOn
  if (json.updatedAt !== undefined) {
    json.modifiedOn = json.updatedAt;
    delete json.updatedAt;
  }

  // Map isDeleted -> isRemoved
  if (json.isDeleted !== undefined) {
    json.isRemoved = json.isDeleted;
    delete json.isDeleted;
  }

  // Recursively format nested objects/arrays (for eager-loaded includes)
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      const value = json[key];
      if (value && typeof value === "object" && !(value instanceof Date)) {
        json[key] = formatLimsEntity(value);
      }
    }
  }

  return json;
};
