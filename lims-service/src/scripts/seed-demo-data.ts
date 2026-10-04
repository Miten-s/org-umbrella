/**
 * Grant the 5 demo lab users (from backend's seed-demo-data.ts) LIMS access,
 * and seed the core master data they'll see: a Demo Lab group, a Lab User
 * role, 5 locations, 5 customers, 5 suppliers.
 *
 * Run AFTER backend/src/scripts/seed-demo-data.ts, with backend running (platform users and
 * the Lab User role are read and written through its internal API).
 * Idempotent: safe to re-run.
 *
 *   npx ts-node src/scripts/seed-demo-data.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import ENV from "../utils/environment";
import { registerAssociations } from "../models/associations";
import Group from "../models/group.model";
import RoleGroup from "../models/role-group.model";
import LimsUser from "../models/lims-user.model";
import UserAccessGroup from "../models/user-access-group.model";
import UserRole from "../models/user-role.model";
import Location from "../models/location.model";
import Customer from "../models/customer.model";
import Supplier from "../models/supplier.model";
import { LIMS_ENTITIES } from "../utils/permissions";
import { ensureRole } from "../services/backend-roles.client";

// Same 5 platform users backend/src/scripts/seed-demo-data.ts creates.
const DEMO_USERS = [
  { name: "Priya Sharma", email: "priya.sharma@demo.local" },
  { name: "Arjun Mehta", email: "arjun.mehta@demo.local" },
  { name: "Sneha Reddy", email: "sneha.reddy@demo.local" },
  { name: "Vikram Rao", email: "vikram.rao@demo.local" },
  { name: "Ananya Iyer", email: "ananya.iyer@demo.local" }
];

const LOCATIONS = [
  "Receiving Bay",
  "Cold Storage Room",
  "QC Bench 1",
  "Microbiology Suite",
  "Sample Archive"
];
const CUSTOMERS = [
  "Acme Pharma",
  "Northwind Biotech",
  "Contoso Labs",
  "Globex Life Sciences",
  "Initech Diagnostics"
];
const SUPPLIERS = [
  "Sigma Reagents",
  "VWR Supplies",
  "Merck Chemicals",
  "Thermo Instruments",
  "Avantor Materials"
];

const DEMO_GROUP_ID = "DEMO_LAB";
const LAB_USER_ROLE_ID = "LAB_USER";

const findPlatformUsersByEmail = async (
  email: string
): Promise<{ id: string }[]> => {
  const response = await fetch(
    `${ENV.BACKEND_INTERNAL_URL}/internal/directory/users`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-api-key": ENV.INTERNAL_API_KEY as string
      },
      body: JSON.stringify({ emails: [email] })
    }
  );
  if (!response.ok) {
    throw new Error(`backend directory API returned ${response.status}`);
  }
  return ((await response.json()) as { users: { id: string }[] }).users;
};

const run = async () => {
  await sequelize.authenticate();
  registerAssociations();

  // ─── Demo Lab group ──────────────────────────────────────────────────────
  const [demoGroup] = await Group.findOrCreate({
    where: { groupId: DEMO_GROUP_ID },
    defaults: {
      groupId: DEMO_GROUP_ID,
      name: "Demo Lab",
      description: "Client demo/test data lives here."
    } as any
  });

  // ─── Lab User role — view/create/edit on every entity, no delete, no bypass ───
  // Stored in backend, like every Lab Role; LIMS records its lab group.
  const labUserRole = await ensureRole(LAB_USER_ROLE_ID, {
    name: "Lab User",
    description:
      "Standard lab user: can view, create and edit records, cannot delete or bypass groups.",
    permissions: LIMS_ENTITIES.flatMap((entity) =>
      ["VIEW", "CREATE", "UPDATE"].map((action) => `LIMS:${action}:${entity}`)
    )
  });
  await RoleGroup.upsert({ roleId: labUserRole.id, groupId: demoGroup.id });

  // ─── Link the 5 demo platform users into LIMS ───────────────────────────
  for (const demoUser of DEMO_USERS) {
    const platformUsers = await findPlatformUsersByEmail(demoUser.email);
    if (!platformUsers.length) {
      throw new Error(
        `Platform user ${demoUser.email} not found — run backend's seed-demo-data.ts first.`
      );
    }
    const platformUserId = platformUsers[0].id;

    const [limsUser] = await LimsUser.findOrCreate({
      where: { userId: platformUserId },
      defaults: {
        userId: platformUserId,
        userName: demoUser.name,
        groupId: demoGroup.id,
        trainingCompleted: true
      } as any
    });

    await UserAccessGroup.findOrCreate({
      where: { limsUserId: limsUser.id, groupId: demoGroup.id },
      defaults: { limsUserId: limsUser.id, groupId: demoGroup.id } as any
    });

    await UserRole.findOrCreate({
      where: { limsUserId: limsUser.id, roleId: labUserRole.id },
      defaults: { limsUserId: limsUser.id, roleId: labUserRole.id } as any
    });

    console.log(`Linked: ${demoUser.name} (${platformUserId}) as a Lab User`);
  }

  // ─── Core master data ────────────────────────────────────────────────────
  for (let i = 0; i < LOCATIONS.length; i++) {
    await Location.findOrCreate({
      where: { locationId: `LOC-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        locationId: `LOC-${String(i + 1).padStart(3, "0")}`,
        locationName: LOCATIONS[i],
        groupId: demoGroup.id
      } as any
    });
  }

  for (let i = 0; i < CUSTOMERS.length; i++) {
    await Customer.findOrCreate({
      where: { customerId: `CUST-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        customerId: `CUST-${String(i + 1).padStart(3, "0")}`,
        customerName: CUSTOMERS[i],
        groupId: demoGroup.id
      } as any
    });
  }

  for (let i = 0; i < SUPPLIERS.length; i++) {
    await Supplier.findOrCreate({
      where: { supplierId: `SUP-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        supplierId: `SUP-${String(i + 1).padStart(3, "0")}`,
        supplierName: SUPPLIERS[i],
        groupId: demoGroup.id
      } as any
    });
  }

  console.log(
    "\nSeeded: Demo Lab group, Lab User role, 5 linked lab users, 5 locations, 5 customers, 5 suppliers."
  );
  console.log(
    "Restart the service (the access cache is in-memory) before testing logins."
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
