/** Bootstraps the first administrator offline (breaks the chicken-and-egg: no CREATE:USER
 * exists yet on an empty database). Idempotent. `npx ts-node src/scripts/bootstrap-admin.ts <platformUserId> [full name]` */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import { registerAssociations } from "../models/associations";
import Group from "../models/group.model";
import Role from "../models/role.model";
import LimsUser from "../models/lims-user.model";
import UserAccessGroup from "../models/user-access-group.model";
import UserRole from "../models/user-role.model";
import { seedPermissions } from "../services/permission.service";

const ROOT_GROUP_ID = "LIMS_ROOT";
const ADMIN_ROLE_ID = "LIMS_ADMIN";

const run = async () => {
  const platformUserId = process.argv[2];
  const fullName = process.argv.slice(3).join(" ") || "LIMS Administrator";

  if (!platformUserId) {
    console.error(
      "Usage: ts-node src/scripts/bootstrap-admin.ts <platformUserId> [full name]\n" +
        "  platformUserId must match the `id` claim in the platform JWT."
    );
    process.exit(1);
  }

  await sequelize.authenticate();
  registerAssociations();
  await seedPermissions();

  // Root group — the top of the hierarchy. Everything else hangs off it, so
  // access to it cascades to every group created later.
  const [rootGroup] = await Group.findOrCreate({
    where: { groupId: ROOT_GROUP_ID },
    defaults: {
      groupId: ROOT_GROUP_ID,
      name: "All Labs",
      description: "Root group. Access here cascades to every child group.",
      ownedBy: platformUserId,
      ownedByName: fullName
    }
  });

  // Self-heal: an earlier run of this script (before ownedByName was set
  // here) may have left the group with an owner id but no owner name.
  if (!rootGroup.ownedBy || !rootGroup.ownedByName) {
    await rootGroup.update({ ownedBy: platformUserId, ownedByName: fullName });
  }

  // Admin role. operateAll bypasses group filtering — every use of it lands on
  // the separate bypass audit stream.
  const [adminRole] = await Role.findOrCreate({
    where: { roleId: ADMIN_ROLE_ID },
    defaults: {
      roleId: ADMIN_ROLE_ID,
      name: "LIMS Administrator",
      description: "Full access. Bypasses group filtering; every use is audited.",
      groupId: rootGroup.id,
      operateAll: true
    }
  });

  const [limsUser, userCreated] = await LimsUser.findOrCreate({
    where: { userId: platformUserId },
    defaults: {
      userId: platformUserId,
      userName: fullName,
      groupId: rootGroup.id,
      trainingCompleted: true
    }
  });

  await UserAccessGroup.findOrCreate({
    where: { limsUserId: limsUser.id, groupId: rootGroup.id },
    defaults: { limsUserId: limsUser.id, groupId: rootGroup.id }
  });

  await UserRole.findOrCreate({
    where: { limsUserId: limsUser.id, roleId: adminRole.id },
    defaults: { limsUserId: limsUser.id, roleId: adminRole.id }
  });

  console.log(
    [
      "",
      userCreated ? "Bootstrapped a new LIMS administrator." : "Administrator already existed — re-linked.",
      `  platform user : ${platformUserId} (${fullName})`,
      `  lims_users.id : ${limsUser.id}`,
      `  root group    : ${ROOT_GROUP_ID} (${rootGroup.id})`,
      `  role          : ${ADMIN_ROLE_ID} — operateAll=true`,
      "",
      "Restart the service (the access cache is in-memory) and this user can sign in.",
      ""
    ].join("\n")
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
