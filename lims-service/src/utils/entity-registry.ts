/** Permission entity code → the `entityName` that entity writes on its audit rows
 * ("LOCATION" → "Storage Location"). Populated by `buildCrudService`, so they can't drift. */
const auditNames = new Map<string, string>();
/** The reverse of `auditNames` — an entity's display name back to its permission code. */
const permissionEntities = new Map<string, string>();

export const registerEntity = (
  permissionEntity: string,
  entityName: string
) => {
  auditNames.set(permissionEntity, entityName);
  permissionEntities.set(entityName, permissionEntity);
};

/** Falls back to the code itself for entities with no CRUD service yet. */
export const auditNameFor = (permissionEntity: string): string =>
  auditNames.get(permissionEntity) ?? permissionEntity;

/** The permission code for an entity's display name ("Instrument" -> "INSTRUMENT") —
 * `authorize()` needs the code, but Attachment only knows its parent's human name. */
export const permissionEntityFor = (entityName: string): string =>
  permissionEntities.get(entityName) ?? entityName;
