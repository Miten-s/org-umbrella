import { QueryInterface } from "sequelize";
import crypto from "crypto";

function stringToUUID(str: string, namespace: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(namespace + ":" + str)
    .digest("hex");
  const p1 = hash.substring(0, 8);
  const p2 = hash.substring(8, 12);
  const p3 = hash.substring(12, 16);
  const p4 = hash.substring(16, 20);
  const p5 = hash.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

/**
 * Bootstrapping the first GXP admin otherwise means Super Admin hand-building a role from
 * scratch (ticking every GXP:* permission). Seeds one ready-made "GXP Master Admin" role
 * instead — granted every current GXP permission, plus a new GXP:OPERATE:ALL sentinel
 * gxp-service's own hasPermission() treats as a service-scoped wildcard (see
 * gxp-service/src/services/user-context.service.ts), so it stays complete as new GXP
 * entities are added later without re-seeding.
 *
 * Deliberately NOT the platform's own OPERATE:ALL — that's Super Admin's global bypass
 * (see backend/src/utils/common.util.ts:isSuperAdmin, exact-string-matched) and must not be
 * conflated with a service-scoped role. Assigning this role still goes through the existing
 * escalation checks (assertNoEscalation/assertRoleTypeAuthority in role.service.ts,
 * preventRoleEscalation in gxp-service) — only Super Admin, or someone who already holds
 * GXP:OPERATE:ALL, can hand it out.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  const now = new Date();

  const operateAllId = stringToUUID("GXP:OPERATE:ALL", "permission");
  await sequelize.query(
    `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
     VALUES (:id, 'GXP:OPERATE:ALL', 'Full access to all current and future GXP actions', 'gxp_service', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: operateAllId, now } }
  );

  const roleId = stringToUUID("GXP Master Admin", "role");
  await sequelize.query(
    `INSERT INTO roles (id, name, type, created_at, updated_at)
     VALUES (:id, 'GXP Master Admin', 'Gxp_Service', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: roleId, now } }
  );

  const roleRows: any[] = await sequelize.query(
    `SELECT id FROM roles WHERE name = 'GXP Master Admin'`,
    { type: "SELECT" }
  );
  const resolvedRoleId = roleRows[0].id;

  // Every gxp_service permission that exists at migration time — including the
  // GXP:OPERATE:ALL row just inserted above.
  await sequelize.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT :roleId, p.id FROM permissions p WHERE p.type = 'gxp_service'
     ON CONFLICT DO NOTHING`,
    { replacements: { roleId: resolvedRoleId } }
  );
};
