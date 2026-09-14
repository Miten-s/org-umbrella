import { QueryInterface } from "sequelize";

/**
 * `016-fix-gxp-permission-names` added correctly-named GXP:*:APPLICATION /
 * APPLICATION_MODULE / SUPPLIER codes, matching gxp-service's real entities. This removes
 * the stale ones they replace (GXP:*:SOFTWARE, SOFTWARE_MODULES, SUPPLIERS) — but first
 * re-points any role that already held one of them at its new equivalent, so a role
 * assigned before this cleanup doesn't silently lose access. Never edit 012/016 in place —
 * this is a new migration precisely so already-deployed environments pick up the rename
 * safely instead of having history rewritten under them.
 */
const RENAMED_GXP_PERMISSIONS: [oldName: string, newName: string][] = [
  ["GXP:CREATE:SOFTWARE", "GXP:CREATE:APPLICATION"],
  ["GXP:VIEW:SOFTWARE", "GXP:VIEW:APPLICATION"],
  ["GXP:UPDATE:SOFTWARE", "GXP:UPDATE:APPLICATION"],
  ["GXP:DELETE:SOFTWARE", "GXP:DELETE:APPLICATION"],
  ["GXP:CREATE:SOFTWARE_MODULES", "GXP:CREATE:APPLICATION_MODULE"],
  ["GXP:VIEW:SOFTWARE_MODULES", "GXP:VIEW:APPLICATION_MODULE"],
  ["GXP:UPDATE:SOFTWARE_MODULES", "GXP:UPDATE:APPLICATION_MODULE"],
  ["GXP:DELETE:SOFTWARE_MODULES", "GXP:DELETE:APPLICATION_MODULE"],
  ["GXP:CREATE:SUPPLIERS", "GXP:CREATE:SUPPLIER"],
  ["GXP:VIEW:SUPPLIERS", "GXP:VIEW:SUPPLIER"],
  ["GXP:UPDATE:SUPPLIERS", "GXP:UPDATE:SUPPLIER"],
  ["GXP:DELETE:SUPPLIERS", "GXP:DELETE:SUPPLIER"]
];

export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  for (const [oldName, newName] of RENAMED_GXP_PERMISSIONS) {
    // Carry forward any existing grant of the old code to the new one.
    await sequelize.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT rp.role_id, newp.id
         FROM role_permissions rp
         JOIN permissions oldp ON oldp.id = rp.permission_id AND oldp.name = :oldName
         JOIN permissions newp ON newp.name = :newName
       ON CONFLICT DO NOTHING`,
      { replacements: { oldName, newName } }
    );

    await sequelize.query(
      `DELETE FROM role_permissions
        WHERE permission_id = (SELECT id FROM permissions WHERE name = :oldName)`,
      { replacements: { oldName } }
    );

    await sequelize.query(`DELETE FROM permissions WHERE name = :oldName`, {
      replacements: { oldName }
    });
  }
};
