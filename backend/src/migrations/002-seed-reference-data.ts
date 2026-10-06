import { QueryInterface, QueryTypes } from "sequelize";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

/** Reference data a fresh database needs: the platform's and GXP's permissions, the
 * built-in roles, the company, and the first Super Admin. LIMS registers its own
 * permissions with backend when it starts; only its wildcard is needed here, for the
 * built-in LIMS Master Admin role.
 *
 * The Super Admin's email and password come from SUPER_ADMIN_EMAIL and
 * SUPER_ADMIN_PASSWORD — required, so no default password ever reaches a real
 * environment. Change the password after the first sign-in. */

type PermissionRow = [name: string, description: string];

const PLATFORM_PERMISSIONS: PermissionRow[] = [
  ["CREATE:DEPARTMENT", "Create a new department"],
  ["CREATE:DESIGNATION", "Create a new designation"],
  ["CREATE:LOCATION", "Create a new location"],
  ["CREATE:PERMISSION", "Create a new permission"],
  ["CREATE:ROLE", "Create a new role"],
  ["CREATE:USER", "Create a user"],
  ["DELETE:DEPARTMENT", "Delete a department"],
  ["DELETE:DESIGNATION", "Delete a designation"],
  ["DELETE:LOCATION", "Delete a location"],
  ["DELETE:PERMISSION", "Delete a permission"],
  ["DELETE:ROLE", "Delete a role"],
  ["DELETE:USER", "Delete a user"],
  ["OPERATE:ALL", "Operate on all resources"],
  ["UPDATE:DEPARTMENT", "Update department details"],
  ["UPDATE:DESIGNATION", "Update designation details"],
  ["UPDATE:LOCATION", "Update location details"],
  ["UPDATE:PERMISSION", "Update permission details"],
  ["UPDATE:ROLE", "Update role details"],
  ["UPDATE:USER", "Update user details"],
  ["VIEW:DASHBOARD", "View the dashboard"],
  ["VIEW:DEPARTMENT", "Read department data"],
  ["VIEW:DESIGNATION", "Read designation data"],
  ["VIEW:LOCATION", "Read location data"],
  ["VIEW:PERMISSION", "Read permission data"],
  ["VIEW:ROLE", "Read role data"],
  ["VIEW:USER", "View users"]
];

const GXP_PERMISSIONS: PermissionRow[] = [
  ["GXP:CREATE:APPLICATION", "Create an application"],
  ["GXP:CREATE:APPLICATION_MODULE", "Create an application module"],
  ["GXP:CREATE:ASSIGNMENT_GROUP", "Create an assignment group"],
  ["GXP:CREATE:ENVIRONMENT", "Create an environment"],
  ["GXP:CREATE:PERMISSION", "Create a permission"],
  ["GXP:CREATE:ROLE", "Create a role"],
  ["GXP:CREATE:SERVICE_REQUEST", "Create a service request"],
  ["GXP:CREATE:SUPPLIER", "Create a supplier"],
  ["GXP:CREATE:USER", "Create a user"],
  ["GXP:CREATE:WORKFLOW", "Create a workflow"],
  ["GXP:DELETE:APPLICATION", "Delete an application"],
  ["GXP:DELETE:APPLICATION_MODULE", "Delete an application module"],
  ["GXP:DELETE:ASSIGNMENT_GROUP", "Delete an assignment group"],
  ["GXP:DELETE:ENVIRONMENT", "Delete an environment"],
  ["GXP:DELETE:PERMISSION", "Delete a permission"],
  ["GXP:DELETE:ROLE", "Delete a role"],
  ["GXP:DELETE:SERVICE_REQUEST", "Delete a service request"],
  ["GXP:DELETE:SUPPLIER", "Delete a supplier"],
  ["GXP:DELETE:USER", "Delete a user"],
  ["GXP:DELETE:WORKFLOW", "Delete a workflow"],
  ["GXP:OPERATE:ALL", "Full access to all current and future GXP actions"],
  ["GXP:UPDATE:APPLICATION", "Update application details"],
  ["GXP:UPDATE:APPLICATION_MODULE", "Update application module details"],
  ["GXP:UPDATE:ASSIGNMENT_GROUP", "Update assignment group details"],
  ["GXP:UPDATE:ENVIRONMENT", "Update environment details"],
  ["GXP:UPDATE:PERMISSION", "Update permission details"],
  ["GXP:UPDATE:ROLE", "Update role details"],
  ["GXP:UPDATE:SERVICE_REQUEST", "Update service request details"],
  ["GXP:UPDATE:SUPPLIER", "Update supplier details"],
  ["GXP:UPDATE:USER", "Update user details"],
  ["GXP:UPDATE:WORKFLOW", "Update workflow details"],
  ["GXP:VIEW:APPLICATION", "View applications"],
  ["GXP:VIEW:APPLICATION_MODULE", "View application modules"],
  ["GXP:VIEW:ASSIGNMENT_GROUP", "View assignment groups"],
  ["GXP:VIEW:ENVIRONMENT", "View environments"],
  ["GXP:VIEW:PERMISSION", "View permissions"],
  ["GXP:VIEW:ROLE", "View roles"],
  ["GXP:VIEW:SERVICE_REQUEST", "View service requests"],
  ["GXP:VIEW:SUPPLIER", "View suppliers"],
  ["GXP:VIEW:USER", "View users"],
  ["GXP:VIEW:WORKFLOW", "View workflows"]
];

const LIMS_PERMISSIONS: PermissionRow[] = [
  ["LIMS:OPERATE:ALL", "Full access to all current and future LIMS actions"]
];

const ROLES: {
  name: string;
  type: string;
  code?: string;
  permissions: string[];
}[] = [
  { name: "Super Admin", type: "Built_In", permissions: ["OPERATE:ALL"] },
  { name: "Admin", type: "Built_In", permissions: ["VIEW:DASHBOARD"] },
  { name: "User", type: "Built_In", permissions: ["VIEW:DASHBOARD"] },
  {
    name: "GXP Master Admin",
    type: "Gxp_Service",
    permissions: ["GXP:OPERATE:ALL"]
  },
  {
    name: "LIMS Master Admin",
    type: "Lims_Service",
    code: "LIMS_MASTER_ADMIN",
    permissions: ["LIMS:OPERATE:ALL"]
  }
];

export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to create the first Super Admin."
    );
  }

  const permissionIds = new Map<string, string>();
  const permissionGroups: [string, PermissionRow[]][] = [
    ["default", PLATFORM_PERMISSIONS],
    ["gxp_service", GXP_PERMISSIONS],
    ["lims_service", LIMS_PERMISSIONS]
  ];
  for (const [type, rows] of permissionGroups) {
    for (const [name, description] of rows) {
      const existing = await db.query<{ id: string }>(
        `SELECT id FROM permissions WHERE name = :name`,
        { replacements: { name }, type: QueryTypes.SELECT }
      );
      let id = existing[0]?.id;
      if (!id) {
        id = randomUUID();
        await db.query(
          `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
           VALUES (:id, :name, :description, :type, now(), now())
           ON CONFLICT (name) DO NOTHING`,
          { replacements: { id, name, description, type } }
        );
      }
      permissionIds.set(name, id);
    }
  }

  const roleIds = new Map<string, string>();
  for (const role of ROLES) {
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM roles WHERE name = :name`,
      { replacements: { name: role.name }, type: QueryTypes.SELECT }
    );
    let id = existing[0]?.id;
    if (!id) {
      id = randomUUID();
      await db.query(
        `INSERT INTO roles (id, name, type, code, created_at, updated_at)
         VALUES (:id, :name, :type, :code, now(), now())
         ON CONFLICT (name) DO NOTHING`,
        {
          replacements: {
            id,
            name: role.name,
            type: role.type,
            code: role.code ?? null
          }
        }
      );
    }
    roleIds.set(role.name, id);

    for (const permission of role.permissions) {
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        {
          replacements: {
            roleId: id,
            permissionId: permissionIds.get(permission)
          }
        }
      );
    }
  }

  const existingCompany = await db.query<{ id: string }>(
    `SELECT id FROM companies LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  if (existingCompany.length === 0) {
    await db.query(
      `INSERT INTO companies (id, name, description, created_at, updated_at)
       VALUES (:id, 'Super Admin Company', 'Super Admin Company', now(), now())`,
      { replacements: { id: randomUUID() } }
    );
  }

  const existingUser = await db.query<{ id: string }>(
    `SELECT id FROM users WHERE email = :email`,
    { replacements: { email }, type: QueryTypes.SELECT }
  );
  let userId = existingUser[0]?.id;
  if (!userId) {
    userId = randomUUID();
    await db.query(
      `INSERT INTO users (id, email, name, full_name, password, user_type, status, current_language, modifiable, training_completed, created_at, updated_at)
       VALUES (:id, :email, 'Super Admin', 'Super Admin', :password, 'User', 'active', 'en', true, false, now(), now())
       ON CONFLICT (email) DO NOTHING`,
      {
        replacements: {
          id: userId,
          email,
          password: await bcrypt.hash(password, 10)
        }
      }
    );
  }

  await db.query(
    `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    { replacements: { userId, roleId: roleIds.get("Super Admin") } }
  );
};
