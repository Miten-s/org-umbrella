/**
 * Moves Lab Role definitions from lims-service's database into backend's roles, and keeps
 * them in sync on re-runs. Assignments are NOT moved: they stay in lims_user_roles, the
 * model GXP already uses (definitions in backend, assignments in the service). Each LIMS
 * role is pointed at its backend copy via lims_roles.backend_role_id.
 *
 * DRY RUN BY DEFAULT. Nothing is written unless --apply is passed, and never while the plan
 * has blockers (name collisions, unknown permissions, a missing seeded role).
 *
 *   npx ts-node src/scripts/migrate-lims-roles.ts [--apply] [--report <file>]
 *   npx ts-node src/scripts/migrate-lims-roles.ts --rollback <runId> [--apply]
 *
 * Both need LIMS_POSTGRES_URI. Backend rows are written in one transaction and recorded in
 * lims_role_migration_map and rbac_audit_log; the LIMS pointers are written afterwards (a
 * separate database, so not the same transaction) and are idempotent — re-run to repair.
 *
 * Rollback undoes the roles a run created and clears their pointers. It refuses if anything
 * assigns a created role, and it does not revert sync edits to roles created by earlier
 * runs — those are in rbac_audit_log with their before-state.
 */
import fs from "fs";
import crypto from "crypto";
import { QueryTypes, Sequelize } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { recordRbacChange } from "../services/rbac-audit.service";
import { publishRbacInvalidation } from "../services/rbac-invalidation.publisher";
import {
  applyPlan,
  loadBackendState,
  mapTableExists
} from "../services/lims-role-sync.service";
import {
  LimsEntryRow,
  LimsRoleRow,
  MigrationPlan,
  buildMigrationPlan
} from "./lims-role-migration.plan";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const rollbackIndex = args.indexOf("--rollback");
const ROLLBACK_RUN_ID = rollbackIndex >= 0 ? args[rollbackIndex + 1] : null;
const reportIndex = args.indexOf("--report");
const REPORT_PATH =
  reportIndex >= 0
    ? args[reportIndex + 1]
    : `lims-role-migration-${ROLLBACK_RUN_ID ? "rollback-" : ""}${APPLY ? "apply" : "dry-run"}-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.md`;

const select = <T extends object>(
  db: Sequelize,
  sql: string,
  replacements = {}
) => db.query<T>(sql, { type: QueryTypes.SELECT, replacements });

const connectLims = () => {
  const uri = process.env.LIMS_POSTGRES_URI;
  if (!uri)
    throw new Error("LIMS_POSTGRES_URI is required (lims-service's database).");
  return new Sequelize(uri, { logging: false });
};

const loadLims = async (lims: Sequelize) => {
  const roles = await select<any>(
    lims,
    `SELECT id::text, role_id, name, operate_all, is_deleted, deleted_at,
            backend_role_id::text
       FROM lims_roles ORDER BY name`
  );
  const entries = await select<any>(
    lims,
    `SELECT role_id::text, entry, can_view, can_create, can_edit, can_remove
       FROM lims_role_entries`
  );

  return {
    roles: roles.map((r): LimsRoleRow => ({
      id: r.id,
      roleCode: r.role_id,
      name: r.name,
      operateAll: !!r.operate_all,
      isDeleted: !!r.is_deleted,
      deletedAt: r.deleted_at,
      backendRoleId: r.backend_role_id
    })),
    entries: entries.map((e): LimsEntryRow => ({
      roleId: e.role_id,
      entry: e.entry,
      canView: !!e.can_view,
      canCreate: !!e.can_create,
      canEdit: !!e.can_edit,
      canRemove: !!e.can_remove
    }))
  };
};

const describeChanges = (plan: MigrationPlan["roles"][number]) => {
  const c = plan.changes;
  if (!c) return "";
  return [
    c.rename ? `rename "${c.rename.from}" → "${c.rename.to}"` : null,
    c.grant.length ? `grant ${c.grant.join(", ")}` : null,
    c.revoke.length ? `revoke ${c.revoke.join(", ")}` : null,
    c.softDelete ? "soft-delete" : null,
    c.restore ? "restore" : null
  ]
    .filter(Boolean)
    .join("; ");
};

const renderReport = (
  plan: MigrationPlan,
  meta: {
    runId: string;
    mode: string;
    hasMapTable: boolean;
    limsRoleCount: number;
  }
) => {
  const by = (a: string) => plan.roles.filter((r) => r.action === a);
  const created = by("create");

  const lines: string[] = [
    `# LIMS role migration — ${meta.mode}`,
    "",
    `Run: \`${meta.runId}\` · ${new Date().toISOString()}`,
    "",
    plan.blockers.length
      ? `**BLOCKED — ${plan.blockers.length} problem(s). Nothing will be written until these are resolved.**`
      : meta.mode === "DRY RUN"
        ? "**No blockers. Nothing was written — re-run with `--apply` to write.**"
        : "**Applied.**",
    "",
    "Role definitions only. Assignments stay in LIMS (lims_user_roles).",
    "",
    "## Summary",
    "",
    "| | Count |",
    "|---|---|",
    `| LIMS roles read | ${meta.limsRoleCount} |`,
    `| Roles to create | ${created.length} (${created.filter((r) => r.deletedAt).length} as soft-deleted) |`,
    `| Permission grants on new roles | ${created.reduce((n, r) => n + r.permissions.length, 0)} |`,
    `| Mapped onto LIMS Master Admin (seeded) | ${by("map_to_master_admin").length} |`,
    `| Already migrated — to sync | ${by("sync").length} |`,
    `| Already migrated — in sync | ${by("in_sync").length} |`,
    `| LIMS pointers to write | ${plan.roles.filter((r) => r.pointerWrite).length} |`,
    `| **Collisions / blockers** | ${plan.blockers.length} |`,
    ""
  ];

  if (plan.blockers.length) {
    lines.push("## Blockers", "");
    for (const b of plan.blockers) lines.push(`- **${b.kind}** — ${b.detail}`);
    lines.push("");
  }

  if (plan.warnings.length || !meta.hasMapTable) {
    lines.push("## Warnings", "");
    if (!meta.hasMapTable) {
      lines.push(
        "- `lims_role_migration_map` does not exist yet (migration 023). Idempotency could not be checked; `--apply` will refuse to run until it does."
      );
    }
    for (const w of plan.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push(
    "## Roles",
    "",
    "| LIMS role | Code | Action | Backend role id | Deleted | Permissions / changes |",
    "|---|---|---|---|---|---|"
  );
  for (const r of plan.roles) {
    const detail =
      r.action === "sync"
        ? describeChanges(r)
        : r.permissions.length > 6
          ? `${r.permissions.length} permissions`
          : r.permissions.join(", ") || "—";
    lines.push(
      `| ${r.limsName} | ${r.roleCode} | ${r.action}${r.pointerWrite ? " + pointer" : ""} | \`${r.backendRoleId}\` | ${r.deletedAt ? "yes" : "no"} | ${detail} |`
    );
  }
  lines.push("");

  return lines.join("\n");
};

const writePointers = async (lims: Sequelize, plan: MigrationPlan) => {
  const pending = plan.roles.filter((r) => r.pointerWrite);
  const t = await lims.transaction();
  try {
    for (const r of pending) {
      await lims.query(
        `UPDATE lims_roles SET backend_role_id = :backendRoleId WHERE id = :limsRoleId`,
        {
          transaction: t,
          replacements: {
            backendRoleId: r.backendRoleId,
            limsRoleId: r.limsRoleId
          }
        }
      );
    }
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
  return pending.length;
};

const migrate = async () => {
  const lims = connectLims();
  const runId = crypto.randomUUID();
  const mode = APPLY ? "APPLY" : "DRY RUN";

  try {
    const limsData = await loadLims(lims);
    const hasMapTable = await mapTableExists();
    const plan = buildMigrationPlan(
      limsData.roles,
      limsData.entries,
      await loadBackendState(hasMapTable)
    );

    const blocked = plan.blockers.length > 0;
    const report = renderReport(plan, {
      runId,
      mode: blocked ? `${mode} (BLOCKED)` : mode,
      hasMapTable,
      limsRoleCount: limsData.roles.length
    });
    fs.writeFileSync(REPORT_PATH, report);
    console.log(report);
    console.log(`\nReport written to ${REPORT_PATH}`);

    if (blocked) {
      console.error("\nBlocked — nothing written.");
      process.exitCode = 1;
      return;
    }
    if (!APPLY) {
      console.log("\nDry run — nothing written. Re-run with --apply to write.");
      return;
    }
    if (!hasMapTable) {
      throw new Error(
        "lims_role_migration_map is missing — run backend migration 023 before --apply."
      );
    }

    const t = await sequelize.transaction();
    try {
      await applyPlan(
        plan,
        {
          runId,
          reason: `LIMS role migration run ${runId}`,
          action: "LIMS_ROLE_MIGRATE"
        },
        t
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
    await publishRbacInvalidation({ scope: "all" });

    // A separate database, so this cannot share the transaction above. Idempotent: if it
    // fails, backend is already correct and a re-run writes the pointers.
    const pointers = await writePointers(lims, plan);
    console.log(
      `\nApplied. Run id ${runId}. ${pointers} LIMS pointer(s) written.`
    );
  } finally {
    await lims.close();
  }
};

const rollback = async (runId: string) => {
  const rows = await select<{
    lims_role_id: string;
    lims_label: string;
    backend_role_id: string;
    disposition: "created" | "mapped_to_existing";
  }>(
    sequelize,
    `SELECT lims_role_id::text, lims_label, backend_role_id::text, disposition
       FROM lims_role_migration_map WHERE run_id = :runId`,
    { runId }
  );
  if (rows.length === 0) {
    throw new Error(`No migration run ${runId} in lims_role_migration_map.`);
  }

  const created = rows.filter((r) => r.disposition === "created");
  const createdIds = created.map((r) => r.backend_role_id);
  const lims = connectLims();

  try {
    // The migration never assigns anyone, so any holder of a created role was added later.
    // Deleting the role would take that access away without anyone deciding to.
    const platformHolders = createdIds.length
      ? await select<{ user_id: string; name: string }>(
          sequelize,
          `SELECT ur.user_id::text, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.role_id::text IN (:ids)`,
          { ids: createdIds }
        )
      : [];
    // After the cutover, LIMS assignments reference backend role ids directly.
    const limsHolders = createdIds.length
      ? await select<{ lims_user_id: string; role_id: string }>(
          lims,
          `SELECT lims_user_id::text, role_id::text FROM lims_user_roles
            WHERE role_id::text IN (:ids)`,
          { ids: createdIds }
        )
      : [];
    const holders = [
      ...platformHolders.map(
        (h) => `platform user \`${h.user_id}\` holds "${h.name}"`
      ),
      ...limsHolders.map(
        (h) =>
          `LIMS user \`${h.lims_user_id}\` is assigned backend role \`${h.role_id}\``
      )
    ];

    const lines = [
      `# LIMS role migration rollback — ${APPLY ? "APPLY" : "DRY RUN"}`,
      "",
      `Run being rolled back: \`${runId}\``,
      "",
      `- Roles to delete (created by this run): ${created.length}`,
      `- Roles left alone (mapped onto existing): ${rows.length - created.length}`,
      `- LIMS pointers to clear: ${rows.length}`,
      "- Not reverted: sync edits to roles created by earlier runs (see rbac_audit_log before-state).",
      ""
    ];
    if (holders.length) {
      lines.push(
        `**BLOCKED — ${holders.length} assignment(s) reference roles this run created. Nothing will be removed.**`,
        "",
        ...holders.map((h) => `- ${h}`),
        ""
      );
    }
    const report = lines.join("\n");
    fs.writeFileSync(REPORT_PATH, report);
    console.log(report);

    if (holders.length) {
      process.exitCode = 1;
      return;
    }
    if (!APPLY) {
      console.log(
        "\nDry run — nothing removed. Re-run with --apply to roll back."
      );
      return;
    }

    const t = await sequelize.transaction();
    try {
      const reason = `Rollback of LIMS role migration run ${runId}`;
      for (const r of created) {
        await sequelize.query(
          `DELETE FROM role_permissions WHERE role_id = :id`,
          {
            transaction: t,
            replacements: { id: r.backend_role_id }
          }
        );
        await sequelize.query(`DELETE FROM roles WHERE id = :id`, {
          transaction: t,
          replacements: { id: r.backend_role_id }
        });
        await recordRbacChange(
          {
            action: "LIMS_MIGRATION_ROLLBACK",
            targetType: "role",
            targetId: r.backend_role_id,
            targetName: r.lims_label,
            reason
          },
          t
        );
      }
      // The audit rows written by the original run stay — the trail is append-only.
      await sequelize.query(
        `DELETE FROM lims_role_migration_map WHERE run_id = :runId`,
        {
          transaction: t,
          replacements: { runId }
        }
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
    await publishRbacInvalidation({ scope: "all" });

    // Only clear pointers still aimed at what this run set, so a later re-point is kept.
    await lims.query(
      `UPDATE lims_roles SET backend_role_id = NULL
        WHERE id::text IN (:limsIds) AND backend_role_id::text IN (:backendIds)`,
      {
        replacements: {
          limsIds: rows.map((r) => r.lims_role_id),
          backendIds: rows.map((r) => r.backend_role_id)
        }
      }
    );
    console.log(`\nRolled back run ${runId}.`);
  } finally {
    await lims.close();
  }
};

const main = async () => {
  try {
    if (ROLLBACK_RUN_ID) await rollback(ROLLBACK_RUN_ID);
    else await migrate();
  } finally {
    await sequelize.close();
  }
};

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error("LIMS role migration failed:", error);
    process.exit(1);
  });
