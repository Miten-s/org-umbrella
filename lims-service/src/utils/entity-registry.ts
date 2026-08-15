/**
 * Permission entity code → the `entityName` that entity writes on its audit
 * rows ("LOCATION" → "Storage Location").
 *
 * They differ because one is a machine code in the permission catalogue and
 * the other is the human label an audit screen shows. Anything writing an
 * audit row for a parent it only knows by code — attachments, for instance —
 * must resolve the label through here, or its entries land under a name the
 * parent's audit endpoint doesn't query for and become invisible.
 *
 * Populated by `buildCrudService`, so an entity is registered by the act of
 * existing and the two can't drift.
 */
const auditNames = new Map<string, string>();

export const registerEntity = (permissionEntity: string, entityName: string) => {
  auditNames.set(permissionEntity, entityName);
};

/** Falls back to the code itself for entities with no CRUD service yet. */
export const auditNameFor = (permissionEntity: string): string =>
  auditNames.get(permissionEntity) ?? permissionEntity;
