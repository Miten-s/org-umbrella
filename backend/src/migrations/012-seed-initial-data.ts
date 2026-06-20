import { QueryInterface } from "sequelize";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Generate a deterministic UUID from a string
function stringToUUID(str: string, namespace: string): string {
  const hash = crypto.createHash("sha256").update(namespace + ":" + str).digest("hex");
  const p1 = hash.substring(0, 8);
  const p2 = hash.substring(8, 12);
  const p3 = hash.substring(12, 16);
  const p4 = hash.substring(16, 20);
  const p5 = hash.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export const up = async (queryInterface: QueryInterface) => {
  const defaultPermissions = [
    { name: "CREATE:PERMISSION", description: "Create a new permission" },
    { name: "VIEW:PERMISSION", description: "Read permission data" },
    { name: "UPDATE:PERMISSION", description: "Update permission details" },
    { name: "DELETE:PERMISSION", description: "Delete a permission" },
    { name: "VIEW:DASHBOARD", description: "View the dashboard" },
    { name: "OPERATE:ALL", description: "Operate on all resources" },
    { name: "CREATE:LOCATION", description: "Create a new location" },
    { name: "VIEW:LOCATION", description: "Read location data" },
    { name: "UPDATE:LOCATION", description: "Update location details" },
    { name: "DELETE:LOCATION", description: "Delete a location" },
    { name: "CREATE:DEPARTMENT", description: "Create a new department" },
    { name: "VIEW:DEPARTMENT", description: "Read department data" },
    { name: "UPDATE:DEPARTMENT", description: "Update department details" },
    { name: "DELETE:DEPARTMENT", description: "Delete a department" },
    { name: "CREATE:DESIGNATION", description: "Create a new designation" },
    { name: "VIEW:DESIGNATION", description: "Read designation data" },
    { name: "UPDATE:DESIGNATION", description: "Update designation details" },
    { name: "DELETE:DESIGNATION", description: "Delete a designation" },
    { name: "CREATE:ROLE", description: "Create a new role" },
    { name: "VIEW:ROLE", description: "Read role data" },
    { name: "UPDATE:ROLE", description: "Update role details" },
    { name: "DELETE:ROLE", description: "Delete a role" },
    { name: "CREATE:USER", description: "Create a user" },
    { name: "VIEW:USER", description: "View users" },
    { name: "UPDATE:USER", description: "Update user details" },
    { name: "DELETE:USER", description: "Delete a user" }
  ];

  const gxpPermissions = [
    { name: "GXP:CREATE:PERMISSION", description: "Create a permission" },
    { name: "GXP:VIEW:PERMISSION", description: "View permissions" },
    { name: "GXP:UPDATE:PERMISSION", description: "Update permission details" },
    { name: "GXP:DELETE:PERMISSION", description: "Delete a permission" },
    { name: "GXP:CREATE:ROLE", description: "Create a role" },
    { name: "GXP:VIEW:ROLE", description: "View roles" },
    { name: "GXP:UPDATE:ROLE", description: "Update role details" },
    { name: "GXP:DELETE:ROLE", description: "Delete a role" },
    { name: "GXP:CREATE:USER", description: "Create a user" },
    { name: "GXP:VIEW:USER", description: "View users" },
    { name: "GXP:UPDATE:USER", description: "Update user details" },
    { name: "GXP:DELETE:USER", description: "Delete a user" },
    { name: "GXP:CREATE:ASSIGNMENT_GROUP", description: "Create an assignment group" },
    { name: "GXP:VIEW:ASSIGNMENT_GROUP", description: "View assignment groups" },
    { name: "GXP:UPDATE:ASSIGNMENT_GROUP", description: "Update assignment group details" },
    { name: "GXP:DELETE:ASSIGNMENT_GROUP", description: "Delete an assignment group" },
    { name: "GXP:CREATE:WORKFLOW", description: "Create a workflow" },
    { name: "GXP:VIEW:WORKFLOW", description: "View workflows" },
    { name: "GXP:UPDATE:WORKFLOW", description: "Update workflow details" },
    { name: "GXP:DELETE:WORKFLOW", description: "Delete a workflow" },
    { name: "GXP:CREATE:ENVIRONMENT", description: "Create an environment" },
    { name: "GXP:VIEW:ENVIRONMENT", description: "View environments" },
    { name: "GXP:UPDATE:ENVIRONMENT", description: "Update environment details" },
    { name: "GXP:DELETE:ENVIRONMENT", description: "Delete an environment" },
    { name: "GXP:CREATE:SUPPLIERS", description: "Create a supplier" },
    { name: "GXP:VIEW:SUPPLIERS", description: "View suppliers" },
    { name: "GXP:UPDATE:SUPPLIERS", description: "Update supplier details" },
    { name: "GXP:DELETE:SUPPLIERS", description: "Delete a supplier" },
    { name: "GXP:CREATE:SOFTWARE_MODULES", description: "Create a software module" },
    { name: "GXP:VIEW:SOFTWARE_MODULES", description: "View software modules" },
    { name: "GXP:UPDATE:SOFTWARE_MODULES", description: "Update software module details" },
    { name: "GXP:DELETE:SOFTWARE_MODULES", description: "Delete a software module" },
    { name: "GXP:CREATE:SOFTWARE", description: "Create a software" },
    { name: "GXP:VIEW:SOFTWARE", description: "View software" },
    { name: "GXP:UPDATE:SOFTWARE", description: "Update software details" },
    { name: "GXP:DELETE:SOFTWARE", description: "Delete a software" },
    { name: "GXP:CREATE:SERVICE_REQUEST", description: "Create a service request" },
    { name: "GXP:VIEW:SERVICE_REQUEST", description: "View service requests" },
    { name: "GXP:UPDATE:SERVICE_REQUEST", description: "Update service request details" },
    { name: "GXP:DELETE:SERVICE_REQUEST", description: "Delete a service request" }
  ];

  const now = new Date();

  // 1. Insert Default Permissions
  for (const perm of defaultPermissions) {
    const id = stringToUUID(perm.name, "permission");
    await queryInterface.sequelize.query(
      `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
       VALUES (:id, :name, :description, 'default', :now, :now)
       ON CONFLICT (name) DO NOTHING`,
      { replacements: { id, name: perm.name, description: perm.description, now } }
    );
  }

  // 2. Insert GxP Permissions
  for (const perm of gxpPermissions) {
    const id = stringToUUID(perm.name, "permission");
    await queryInterface.sequelize.query(
      `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
       VALUES (:id, :name, :description, 'gxp_service', :now, :now)
       ON CONFLICT (name) DO NOTHING`,
      { replacements: { id, name: perm.name, description: perm.description, now } }
    );
  }

  // 3. Create Super Admin, Admin, User roles
  const tempSuperAdminRoleId = stringToUUID("Super Admin", "role");
  const tempAdminRoleId = stringToUUID("Admin", "role");
  const tempUserRoleId = stringToUUID("User", "role");

  await queryInterface.sequelize.query(
    `INSERT INTO roles (id, name, type, created_at, updated_at)
     VALUES (:id, 'Super Admin', 'Built_In', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: tempSuperAdminRoleId, now } }
  );

  await queryInterface.sequelize.query(
    `INSERT INTO roles (id, name, type, created_at, updated_at)
     VALUES (:id, 'Admin', 'Built_In', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: tempAdminRoleId, now } }
  );

  await queryInterface.sequelize.query(
    `INSERT INTO roles (id, name, type, created_at, updated_at)
     VALUES (:id, 'User', 'Built_In', :now, :now)
     ON CONFLICT (name) DO NOTHING`,
    { replacements: { id: tempUserRoleId, now } }
  );

  // RESOLVE ACTUAL ROLE IDs FROM DB (important to avoid FK violations if they already existed under different IDs)
  const getRoleId = async (name: string): Promise<string> => {
    const rows: any[] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = :name`,
      { replacements: { name }, type: "SELECT" }
    );
    return rows[0].id;
  };

  const superAdminRoleId = await getRoleId("Super Admin");
  const adminRoleId = await getRoleId("Admin");
  const userRoleId = await getRoleId("User");

  // 4. Map permissions to roles
  // Super Admin gets OPERATE:ALL
  const operateAllPerm: any[] = await queryInterface.sequelize.query(
    `SELECT id FROM permissions WHERE name = 'OPERATE:ALL'`,
    { type: "SELECT" }
  );
  if (operateAllPerm.length > 0) {
    await queryInterface.sequelize.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES (:roleId, :permId)
       ON CONFLICT DO NOTHING`,
      { replacements: { roleId: superAdminRoleId, permId: operateAllPerm[0].id } }
    );
  }

  // Admin gets all non-OPERATE:ALL permissions
  const adminPerms: any[] = await queryInterface.sequelize.query(
    `SELECT id FROM permissions WHERE name != 'OPERATE:ALL'`,
    { type: "SELECT" }
  );
  for (const perm of adminPerms) {
    await queryInterface.sequelize.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES (:roleId, :permId)
       ON CONFLICT DO NOTHING`,
      { replacements: { roleId: adminRoleId, permId: perm.id } }
    );
  }

  // User gets VIEW:DASHBOARD
  const userPerms: any[] = await queryInterface.sequelize.query(
    `SELECT id FROM permissions WHERE name = 'VIEW:DASHBOARD'`,
    { type: "SELECT" }
  );
  if (userPerms.length > 0) {
    await queryInterface.sequelize.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES (:roleId, :permId)
       ON CONFLICT DO NOTHING`,
      { replacements: { roleId: userRoleId, permId: userPerms[0].id } }
    );
  }

  // 5. Create Company (Check if already exists to avoid duplication)
  const existingCompany: any[] = await queryInterface.sequelize.query(
    `SELECT id FROM companies WHERE name = 'Super Admin Company'`,
    { type: "SELECT" }
  );
  if (existingCompany.length === 0) {
    const companyId = stringToUUID("Super Admin Company", "company");
    await queryInterface.sequelize.query(
      `INSERT INTO companies (id, name, description, created_at, updated_at)
       VALUES (:id, 'Super Admin Company', 'Super Admin Company', :now, :now)`,
      { replacements: { id: companyId, now } }
    );
  }

  // 6. Create Super Admin User
  const passwordHash = await bcrypt.hash("SuperAdmin@123", 10);
  const tempUserId = stringToUUID("superadmin@example.com", "user");

  await queryInterface.sequelize.query(
    `INSERT INTO users (id, email, name, full_name, password, user_type, status, current_language, modifiable, training_completed, created_at, updated_at)
     VALUES (:id, 'superadmin@example.com', 'Super Admin', 'superadmin', :passwordHash, 'User', 'active', 'en', true, false, :now, :now)
     ON CONFLICT (email) DO NOTHING`,
    { replacements: { id: tempUserId, passwordHash, now } }
  );

  // RESOLVE ACTUAL USER ID
  const userRows: any[] = await queryInterface.sequelize.query(
    `SELECT id FROM users WHERE email = 'superadmin@example.com'`,
    { type: "SELECT" }
  );
  const userId = userRows[0].id;

  // Associate user to Super Admin role
  await queryInterface.sequelize.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES (:userId, :roleId)
     ON CONFLICT DO NOTHING`,
    { replacements: { userId, roleId: superAdminRoleId } }
  );
};

export const down = async (queryInterface: QueryInterface) => {
  // No rollback needed for production seeds
};
