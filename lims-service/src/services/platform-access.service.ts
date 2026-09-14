import { QueryTypes } from "sequelize";
import { authSequelize } from "../configs/db.sequelize";

/** Is this platform user Super Admin (holds OPERATE:ALL)? Super Admin has full access to
 * every service without needing a lims_users row (ROLES_AND_ACCESS_MANAGEMENT.md). */
export const isPlatformSuperAdmin = async (
  platformUserId: string
): Promise<boolean> => {
  const rows = await authSequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :platformUserId AND p.name = 'OPERATE:ALL'
     ) AS "exists"`,
    { replacements: { platformUserId }, type: QueryTypes.SELECT }
  );

  return Boolean(rows[0]?.exists);
};
