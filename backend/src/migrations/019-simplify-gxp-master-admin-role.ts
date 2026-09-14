import { QueryInterface } from "sequelize";

/**
 * `018-seed-gxp-master-admin-role` attached every individual gxp_service permission
 * alongside the GXP:OPERATE:ALL wildcard, so the role would be literally complete. In
 * practice this made the Roles UI show "select all" with 40+ checked boxes, which reads as
 * confusing/redundant next to the platform's own Super Admin role (which holds only
 * OPERATE:ALL, nothing else — and is already hidden from the permission picker by
 * `permission.service.ts:getPermissions`'s `%OPERATE:ALL%` exclusion, same as this one will
 * be). Drops back to just the wildcard, matching that existing pattern exactly. No access
 * changes — GXP:OPERATE:ALL alone already grants everything via gxp-service's hasPermission.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  await sequelize.query(
    `DELETE FROM role_permissions
      WHERE role_id = (SELECT id FROM roles WHERE name = 'GXP Master Admin')
        AND permission_id != (SELECT id FROM permissions WHERE name = 'GXP:OPERATE:ALL')`
  );
};
