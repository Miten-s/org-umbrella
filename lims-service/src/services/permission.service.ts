import Permission from "../models/permission.model";
import { ALL_PERMISSIONS, LIMS_ENTITIES, ENTITY_LABELS, LIMS_ACTIONS } from "../utils/permissions";
import { logInfo } from "../configs/logger.config";

/** Mirrors the code-defined permission vocabulary into `lims_permissions` on every boot —
 * inserts, updates, and removes stale rows so a retired permission can't stay grantable. */
export const seedPermissions = async () => {
  const existing = await Permission.findAll();
  const existingByCode = new Map(existing.map((row) => [row.code, row]));
  const codesInCode = new Set(ALL_PERMISSIONS.map((p) => p.code));

  let inserted = 0;
  let updated = 0;

  for (const definition of ALL_PERMISSIONS) {
    const row = existingByCode.get(definition.code);
    if (!row) {
      await Permission.create(definition);
      inserted += 1;
    } else if (
      row.label !== definition.label ||
      row.entity !== definition.entity ||
      row.action !== definition.action
    ) {
      await row.update({
        label: definition.label,
        entity: definition.entity,
        action: definition.action
      });
      updated += 1;
    }
  }

  const stale = existing.filter((row) => !codesInCode.has(row.code));
  for (const row of stale) {
    await row.destroy();
  }

  logInfo("permission catalogue synced", {
    total: ALL_PERMISSIONS.length,
    inserted,
    updated,
    removed: stale.length
  });
};

/** The catalogue, shaped for the Role form's Permissions grid: one row per entity with its
 * four actions. The Entry field is a dropdown over `entities[].code`, never free text. */
export const getPermissionCatalogue = async () => {
  const rows = await Permission.findAll({ order: [["code", "ASC"]] });

  return {
    entities: LIMS_ENTITIES.map((entity) => ({
      code: entity,
      label: ENTITY_LABELS[entity],
      actions: LIMS_ACTIONS
    })),
    permissions: rows.map((row) => ({
      id: row.id,
      code: row.code,
      entity: row.entity,
      action: row.action,
      label: row.label
    }))
  };
};
