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
 * `012-seed-initial-data` named GXP's permission codes after an older domain vocabulary
 * (SOFTWARE, SOFTWARE_MODULES, SUPPLIERS) that no longer matches gxp-service's actual
 * entities (Application, ApplicationModule, Supplier). Adds the correctly-named codes
 * gxp-service's new authorize middleware checks against; leaves the old rows in place
 * (unreferenced by any route, but not deleted — a role may already list them).
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  const now = new Date();

  const permissions = [
    { name: "GXP:CREATE:APPLICATION", description: "Create an application" },
    { name: "GXP:VIEW:APPLICATION", description: "View applications" },
    {
      name: "GXP:UPDATE:APPLICATION",
      description: "Update application details"
    },
    { name: "GXP:DELETE:APPLICATION", description: "Delete an application" },
    {
      name: "GXP:CREATE:APPLICATION_MODULE",
      description: "Create an application module"
    },
    {
      name: "GXP:VIEW:APPLICATION_MODULE",
      description: "View application modules"
    },
    {
      name: "GXP:UPDATE:APPLICATION_MODULE",
      description: "Update application module details"
    },
    {
      name: "GXP:DELETE:APPLICATION_MODULE",
      description: "Delete an application module"
    },
    { name: "GXP:CREATE:SUPPLIER", description: "Create a supplier" },
    { name: "GXP:VIEW:SUPPLIER", description: "View suppliers" },
    { name: "GXP:UPDATE:SUPPLIER", description: "Update supplier details" },
    { name: "GXP:DELETE:SUPPLIER", description: "Delete a supplier" }
  ];

  for (const perm of permissions) {
    const id = stringToUUID(perm.name, "permission");
    await sequelize.query(
      `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
       VALUES (:id, :name, :description, 'gxp_service', :now, :now)
       ON CONFLICT (name) DO NOTHING`,
      {
        replacements: {
          id,
          name: perm.name,
          description: perm.description,
          now
        }
      }
    );
  }
};
