/**
 * Compares LIMS's own permission resolution with backend's for every active LIMS user —
 * the parity check that must show zero differences before enforcement moves to backend.
 * Read-only on both sides.
 *
 *   npx ts-node src/scripts/check-permission-parity.ts
 *
 * Needs INTERNAL_API_KEY and BACKEND_INTERNAL_URL (a running backend). Exits 1 on any
 * mismatch, or if backend could not answer for someone — an unanswered user is not proof
 * of parity.
 */
import { sequelize } from "../configs/db.sequelize";
import LimsUser from "../models/lims-user.model";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import { registerAssociations } from "../models/associations";
import {
  permissionsFromRoles,
  resolveViaBackend
} from "../services/user-context.service";
import { comparePermissions } from "../services/permission-parity";

const main = async () => {
  // Not connectDB(): that also seeds the permission catalogue, and this script is read-only.
  registerAssociations();

  const users = (await LimsUser.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: Role,
        as: "roles",
        required: false,
        where: { isDeleted: false },
        include: [{ model: RoleEntry, as: "entries", required: false }]
      }
    ],
    order: [["userName", "ASC"]]
  })) as (LimsUser & { roles?: (Role & { entries?: RoleEntry[] })[] })[];

  let mismatches = 0;
  let unanswered = 0;
  let unmigrated = 0;

  console.log(`Checking ${users.length} active LIMS user(s)\n`);
  console.log("| User | Platform user id | Result | Detail |");
  console.log("|---|---|---|---|");

  for (const user of users) {
    const roles = user.roles ?? [];
    const local = permissionsFromRoles(roles);
    const backend = await resolveViaBackend(
      roles.map((role) => ({
        name: role.name,
        backendRoleId: role.backendRoleId ?? null
      }))
    );

    if (backend.status === "unreachable") {
      unanswered++;
      console.log(
        `| ${user.userName} | \`${user.userId}\` | NO ANSWER | backend unreachable |`
      );
      continue;
    }
    if (backend.status === "unmigrated") {
      unmigrated++;
      console.log(
        `| ${user.userName} | \`${user.userId}\` | **UNMIGRATED ROLE** | no backend copy yet: ${backend.roleNames.join(", ")} — run migrate-lims-roles |`
      );
      continue;
    }

    const parity = comparePermissions(local, backend.permissions);
    if (parity.match) {
      const summary = local.operateAll
        ? "operate_all on both"
        : `${local.permissions.size} permission(s)`;
      console.log(
        `| ${user.userName} | \`${user.userId}\` | match | ${summary} |`
      );
      continue;
    }

    mismatches++;
    const detail = [
      parity.localOperateAll !== parity.backendOperateAll
        ? `operate_all local=${parity.localOperateAll} backend=${parity.backendOperateAll}`
        : null,
      parity.onlyLocal.length
        ? `only in LIMS: ${parity.onlyLocal.join(", ")}`
        : null,
      parity.onlyBackend.length
        ? `only in backend: ${parity.onlyBackend.join(", ")}`
        : null
    ]
      .filter(Boolean)
      .join("; ");
    console.log(
      `| ${user.userName} | \`${user.userId}\` | **MISMATCH** | ${detail} |`
    );
  }

  console.log(
    `\n${users.length - mismatches - unanswered - unmigrated} match, ${mismatches} mismatch, ${unmigrated} unmigrated, ${unanswered} unanswered.`
  );
  if (mismatches || unanswered || unmigrated) {
    console.log("NOT safe to move enforcement to backend.");
    process.exitCode = 1;
  } else {
    console.log("Parity holds for every active LIMS user.");
  }
};

main()
  .catch((error) => {
    console.error("Parity check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
    process.exit(process.exitCode ?? 0);
  });
