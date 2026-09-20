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

/** Mirrors lims-service/src/utils/permissions.ts (LIMS_ENTITIES). Duplicated rather than
 * imported: backend must not depend on another service's source tree, and a migration has
 * to stay pinned to what it seeded even if that list changes later. */
const LIMS_ENTITIES = [
  "ALIQUOT",
  "ANALYSIS",
  "BATCH",
  "CALIBRATION",
  "CUSTOMER",
  "GROUP",
  "INSPECTION_PLAN",
  "INSTRUMENT",
  "INSTRUMENT_PART",
  "LOCATION",
  "LOT",
  "PARAMETER",
  "PHRASE",
  "PROJECT",
  "RESULT",
  "ROLE",
  "SAMPLE",
  "SCHEDULER",
  "SPECIFICATION",
  "STOCK",
  "STOCK_BATCH",
  "STUDY",
  "SUPPLIER",
  "TEST",
  "TEST_GROUP",
  "USER"
] as const;

const LIMS_ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE"] as const;

/** `LIMS:CREATE:SAMPLE` — same wire format lims-service already emits. */
const permissionCode = (action: string, entity: string) =>
  `LIMS:${action}:${entity}`;

/** LIMS's own wildcard is the BARE string "OPERATE:ALL" (see lims-service's
 * permissions.ts), which is byte-identical to the platform's super-admin permission. Seeding
 * or migrating that constant as-is would hand platform super-admin to every lab manager
 * holding it. The backend-side wildcard is deliberately namespaced instead. */
const LIMS_OPERATE_ALL = "LIMS:OPERATE:ALL";

/** Seeds the LIMS permission catalogue: 26 entities x 4 actions, plus the namespaced
 * wildcard. Additive only — lims-service keeps resolving permissions from its own tables
 * and is unaffected until its cutover. */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  const now = new Date();

  // Guard, not decoration: if this ever emitted the bare string it would silently grant
  // platform super-admin, so fail the migration instead.
  if ((LIMS_OPERATE_ALL as string) === "OPERATE:ALL") {
    throw new Error(
      "LIMS wildcard must be namespaced — refusing to seed the platform super-admin permission."
    );
  }

  const rows = [
    ...LIMS_ENTITIES.flatMap((entity) =>
      LIMS_ACTIONS.map((action) => ({
        name: permissionCode(action, entity),
        description: `${action} ${entity.toLowerCase().replace(/_/g, " ")} records in LIMS`
      }))
    ),
    {
      name: LIMS_OPERATE_ALL,
      description: "Full access to all current and future LIMS actions"
    }
  ];

  if (rows.length !== LIMS_ENTITIES.length * LIMS_ACTIONS.length + 1) {
    throw new Error(`Unexpected LIMS permission count: ${rows.length}`);
  }

  for (const row of rows) {
    if (row.name === "OPERATE:ALL") {
      throw new Error("Refusing to seed the bare OPERATE:ALL permission.");
    }

    await sequelize.query(
      `INSERT INTO permissions (id, name, description, type, created_at, updated_at)
       VALUES (:id, :name, :description, 'lims_service', :now, :now)
       ON CONFLICT (name) DO NOTHING`,
      {
        replacements: {
          id: stringToUUID(row.name, "permission"),
          name: row.name,
          description: row.description,
          now
        }
      }
    );
  }
};
