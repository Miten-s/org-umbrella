/**
 * Seed 5 demo lab users (plus the locations/departments/designations they
 * hang off) for client testing.
 *
 * Idempotent: safe to re-run. Doesn't touch the superadmin — migration
 * 002-seed-reference-data.ts already creates that on boot.
 *
 * Next step after this: run lims-service's seed-demo-data.ts to link these
 * platform users into LIMS.
 *
 *   npx ts-node src/scripts/seed-demo-data.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import Location from "../models/location.model";
import Department from "../models/department.model";
import Designation from "../models/designation.model";
import User from "../models/user.model";
import Role from "../models/role.model";

const LOCATIONS = [
  "Receiving Bay",
  "Cold Storage Room",
  "QC Bench 1",
  "Microbiology Suite",
  "Sample Archive"
];
const DEPARTMENTS = [
  "Quality Control",
  "Quality Assurance",
  "Microbiology",
  "Warehouse",
  "Regulatory Affairs"
];
const DESIGNATIONS = [
  "Lab Analyst",
  "Senior Analyst",
  "Lab Technician",
  "QA Officer",
  "Lab Supervisor"
];

const USERS = [
  { name: "Priya Sharma", email: "priya.sharma@demo.local" },
  { name: "Arjun Mehta", email: "arjun.mehta@demo.local" },
  { name: "Sneha Reddy", email: "sneha.reddy@demo.local" },
  { name: "Vikram Rao", email: "vikram.rao@demo.local" },
  { name: "Ananya Iyer", email: "ananya.iyer@demo.local" }
];

const DEMO_PASSWORD = "Demo@12345";

const run = async () => {
  await sequelize.authenticate();

  const userRole = await Role.findOne({ where: { name: "User" } });
  if (!userRole) {
    throw new Error(
      '"User" role not found — migration 002-seed-reference-data.ts must run first.'
    );
  }

  const locations = [];
  for (let i = 0; i < LOCATIONS.length; i++) {
    const [row] = await Location.findOrCreate({
      where: { locationName: LOCATIONS[i] },
      defaults: { locationName: LOCATIONS[i], status: "active" } as any
    });
    locations.push(row);
  }

  const departments = [];
  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const [row] = await Department.findOrCreate({
      where: { departmentName: DEPARTMENTS[i] },
      defaults: {
        departmentName: DEPARTMENTS[i],
        departmentGroupLocationId: locations[i].id,
        status: "active"
      } as any
    });
    departments.push(row);
  }

  const designations = [];
  for (let i = 0; i < DESIGNATIONS.length; i++) {
    const [row] = await Designation.findOrCreate({
      where: { designationName: DESIGNATIONS[i] },
      defaults: { designationName: DESIGNATIONS[i], status: "active" } as any
    });
    designations.push(row);
  }

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const [user, created] = await User.findOrCreate({
      where: { email: u.email },
      defaults: {
        email: u.email,
        name: u.name,
        fullName: u.name,
        password: DEMO_PASSWORD,
        userType: "User",
        status: "active",
        departmentId: departments[i].id,
        designationId: designations[i].id,
        locationId: locations[i].id,
        modifiable: true,
        trainingCompleted: true
      } as any
    });

    await sequelize.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON CONFLICT DO NOTHING`,
      { replacements: { userId: user.id, roleId: userRole.id } }
    );

    console.log(
      `${created ? "Created" : "Already existed"}: ${u.email} (id ${user.id})`
    );
  }

  console.log(`\nDemo password for all 5 lab users: ${DEMO_PASSWORD}`);
  console.log(
    "Next: run lims-service's seed-demo-data.ts to grant these users LIMS access."
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
