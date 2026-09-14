import { QueryInterface } from "sequelize";

/**
 * `012-seed-initial-data` gave the Built_In "Admin" role every non-OPERATE:ALL permission,
 * including every GXP:* code — an accidental blanket grant, not a deliberate one (see
 * ROLES_AND_ACCESS_MANAGEMENT.md). `userType: "Admin"` becomes a profile label only; real
 * access is granted per-service (GXP Users, LIMS Lab Users), not by this role.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  const adminRole: any[] = await sequelize.query(
    `SELECT id FROM roles WHERE name = 'Admin' AND type = 'Built_In'`,
    { type: "SELECT" }
  );
  if (adminRole.length === 0) return;

  await sequelize.query(
    `DELETE FROM role_permissions
     WHERE role_id = :roleId
       AND permission_id IN (SELECT id FROM permissions WHERE name != 'VIEW:DASHBOARD')`,
    { replacements: { roleId: adminRole[0].id } }
  );
};
