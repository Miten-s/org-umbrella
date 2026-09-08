import { Model, ModelStatic } from "sequelize";

/** Permission entity code → the `entityName` that entity writes on its audit rows
 * ("LOCATION" → "Storage Location"). Populated by `buildCrudService`, so they can't drift. */
const auditNames = new Map<string, string>();
/** The reverse of `auditNames` — an entity's display name back to its permission code. */
const permissionEntities = new Map<string, string>();
/** Permission entity code → its Sequelize model, so cross-entity code (Attachments) can
 * load and group-scope a parent record it only knows by permission code. */
const models = new Map<string, ModelStatic<Model>>();

export const registerEntity = (
  permissionEntity: string,
  entityName: string,
  model?: ModelStatic<Model>
) => {
  auditNames.set(permissionEntity, entityName);
  permissionEntities.set(entityName, permissionEntity);
  if (model) models.set(permissionEntity, model);
};

/** Falls back to the code itself for entities with no CRUD service yet. */
export const auditNameFor = (permissionEntity: string): string =>
  auditNames.get(permissionEntity) ?? permissionEntity;

/** The permission code for an entity's display name ("Instrument" -> "INSTRUMENT") —
 * `authorize()` needs the code, but Attachment only knows its parent's human name. */
export const permissionEntityFor = (entityName: string): string =>
  permissionEntities.get(entityName) ?? entityName;

/** The model behind a permission code, if it's been registered by `buildCrudService`. */
export const modelFor = (
  permissionEntity: string
): ModelStatic<Model> | undefined => models.get(permissionEntity);
