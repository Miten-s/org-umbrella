/**
 * Grant the 5 demo lab users (from backend's seed-demo-data.ts) LIMS access,
 * and seed the core master data they'll see: a Demo Lab group, a Lab User
 * role, 5 locations, 5 customers, 5 suppliers.
 *
 * Run AFTER backend/src/scripts/seed-demo-data.ts.
 * Idempotent: safe to re-run.
 *
 *   npx ts-node src/scripts/seed-demo-data.ts
 */
import "dotenv/config";
import { QueryTypes } from "sequelize";
import { sequelize, authSequelize } from "../configs/db.sequelize";
import { registerAssociations } from "../models/associations";
import Group from "../models/group.model";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import LimsUser from "../models/lims-user.model";
import UserAccessGroup from "../models/user-access-group.model";
import UserRole from "../models/user-role.model";
import Location from "../models/location.model";
import Customer from "../models/customer.model";
import Supplier from "../models/supplier.model";
import { LIMS_ENTITIES } from "../utils/permissions";

// Same 5 platform users backend/src/scripts/seed-demo-data.ts creates.
const DEMO_USERS = [
  { name: "Priya Sharma", email: "priya.sharma@demo.local" },
  { name: "Arjun Mehta", email: "arjun.mehta@demo.local" },
  { name: "Sneha Reddy", email: "sneha.reddy@demo.local" },
  { name: "Vikram Rao", email: "vikram.rao@demo.local" },
  { name: "Ananya Iyer", email: "ananya.iyer@demo.local" }
];

const LOCATIONS = ["Receiving Bay", "Cold Storage Room", "QC Bench 1", "Microbiology Suite", "Sample Archive"];
const CUSTOMERS = ["Acme Pharma", "Northwind Biotech", "Contoso Labs", "Globex Life Sciences", "Initech Diagnostics"];
const SUPPLIERS = ["Sigma Reagents", "VWR Supplies", "Merck Chemicals", "Thermo Instruments", "Avantor Materials"];

const DEMO_GROUP_ID = "DEMO_LAB";
const LAB_USER_ROLE_ID = "LAB_USER";

const run = async () => {
  await sequelize.authenticate();
  await authSequelize.authenticate();
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
  const [labUserRole] = await Role.findOrCreate({
    where: { roleId: LAB_USER_ROLE_ID },
    defaults: {
      roleId: LAB_USER_ROLE_ID,
      name: "Lab User",
      description: "Standard lab user: can view, create and edit records, cannot delete or bypass groups.",
      groupId: demoGroup.id,
      operateAll: false
    } as any
  });

  for (const entity of LIMS_ENTITIES) {
    await RoleEntry.findOrCreate({
      where: { roleId: labUserRole.id, entry: entity },
      defaults: {
        roleId: labUserRole.id,
        entry: entity,
        canView: true,
        canCreate: true,
        canEdit: true,
        canRemove: false
      } as any
    });
  }

  // ─── Link the 5 demo platform users into LIMS ───────────────────────────
  for (const demoUser of DEMO_USERS) {
    const platformUsers = await authSequelize.query<{ id: string }>(
      `SELECT id FROM users WHERE email = :email`,
      { replacements: { email: demoUser.email }, type: QueryTypes.SELECT }
    );
    if (!platformUsers.length) {
      throw new Error(`Platform user ${demoUser.email} not found — run backend's seed-demo-data.ts first.`);
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
  console.log("Restart the service (the access cache is in-memory) before testing logins.");

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
