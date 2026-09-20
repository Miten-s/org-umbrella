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

/** The LIMS counterpart to "GXP Master Admin". Follows 019's shape, not 018's: the role
 * holds ONLY the LIMS:OPERATE:ALL wildcard, not all 104 individual permissions, so the
 * Roles UI doesn't render it as a sea of checked boxes. The wildcard alone grants
 * everything once LIMS permission resolution moves to backend.
 *
 * Deliberately NOT the platform's own OPERATE:ALL — that is Super Admin's global bypass. */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  const now = new Date();

  const wildcardRows: any[] = await sequelize.query(
    `SELECT id FROM permissions WHERE name = 'LIMS:OPERATE:ALL'`,
    { type: "SELECT" }
  );

  if (wildcardRows.length === 0) {
    throw new Error(
      "LIMS:OPERATE:ALL not found — 021-seed-lims-permission-catalog must run first."
    );
  }

  const roleId = stringToUUID("LIMS Master Admin", "role");
  await sequelize.query(
    `INSERT INTO roles (id, name, type, created_at, updated_at)
     VALUES (:id, 'LIMS Master Admin', 'Lims_Service', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: roleId, now } }
  );

  const roleRows: any[] = await sequelize.query(
    `SELECT id FROM roles WHERE name = 'LIMS Master Admin'`,
    { type: "SELECT" }
  );

  await sequelize.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     VALUES (:roleId, :permissionId)
     ON CONFLICT DO NOTHING`,
    {
      replacements: {
        roleId: roleRows[0].id,
        permissionId: wildcardRows[0].id
      }
    }
  );
};
