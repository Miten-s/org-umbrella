import crypto from "crypto";
import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { IUser } from "../models/user.model";
import { RbacAuditAction } from "../models/rbac-audit-log.model";
import { recordRbacChange } from "./rbac-audit.service";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";
import {
  BackendRole,
  BackendState,
  Blocker,
  LimsEntryRow,
  LimsRoleRow,
  MigrationPlan,
  LIMS_SERVICE_ROLE_TYPE,
  buildMigrationPlan
} from "../scripts/lims-role-migration.plan";

/** Brings backend's Lims_Service roles in line with LIMS's Lab Roles. One code path for
 * both callers: the one-off/repair script (migrate-lims-roles.ts) and the live mirror
 * lims-service pushes through the internal API on every role change. */

const select = <T extends object>(
  sql: string,
  replacements = {},
  transaction?: Transaction
) =>
  sequelize.query<T>(sql, {
    type: QueryTypes.SELECT,
    replacements,
    transaction
  });

export const mapTableExists = async () => {
  const [row] = await select<{ t: string | null }>(
    `SELECT to_regclass('public.lims_role_migration_map')::text AS t`
  );
  return !!row?.t;
};

export const loadBackendState = async (
  hasMapTable: boolean,
  transaction?: Transaction
): Promise<BackendState> => {
  const permissions = await select<{ id: string; name: string }>(
    `SELECT id::text, name FROM permissions
      WHERE name LIKE 'LIMS:%' AND deleted_at IS NULL`,
    {},
    transaction
  );
  // Soft-deleted roles included deliberately: roles.name is unique across them too.
  const roles = await select<{
    id: string;
    name: string;
    type: string;
    deleted: boolean;
    permissions: string[] | null;
  }>(
    `SELECT r.id::text, r.name, r.type, r.deleted_at IS NOT NULL AS deleted,
            array_remove(array_agg(p.name ORDER BY p.name), NULL) AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id`,
    {},
    transaction
  );
  const migrated = hasMapTable
    ? await select<{ lims_role_id: string; backend_role_id: string }>(
        `SELECT lims_role_id::text, backend_role_id::text FROM lims_role_migration_map`,
        {},
        transaction
      )
    : [];

  const all: BackendRole[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    deleted: r.deleted,
    permissions: r.permissions ?? []
  }));

  return {
    permissionIdsByName: new Map(permissions.map((p) => [p.name, p.id])),
    rolesByName: new Map(all.map((r) => [r.name, r])),
    rolesById: new Map(all.map((r) => [r.id, r])),
    alreadyMigrated: new Map(
      migrated.map((m) => [m.lims_role_id, m.backend_role_id])
    )
  };
};

export interface ApplyOptions {
  runId: string;
  reason: string;
  action: RbacAuditAction;
  actor?: Pick<IUser, "id" | "email">;
}

/** Writes a plan's backend changes inside the caller's transaction: roles, their
 * permissions, the ledger and the audit trail. */
export const applyPlan = async (
  plan: MigrationPlan,
  options: ApplyOptions,
  t: Transaction
): Promise<void> => {
  const now = new Date();
  const actor = options.actor as IUser | undefined;
  const permissionIds = new Map(
    (
      await select<{ id: string; name: string }>(
        `SELECT id::text, name FROM permissions WHERE name LIKE 'LIMS:%'`,
        {},
        t
      )
    ).map((p) => [p.name, p.id])
  );

  const grant = async (roleId: string, names: string[]) => {
    for (const name of names) {
      await sequelize.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)`,
        {
          transaction: t,
          replacements: { roleId, permissionId: permissionIds.get(name) }
        }
      );
    }
  };

  const recordMap = (row: {
    limsId: string;
    label: string;
    backendRoleId: string;
    disposition: "created" | "mapped_to_existing";
  }) =>
    sequelize.query(
      `INSERT INTO lims_role_migration_map
         (id, run_id, lims_role_id, lims_label, backend_role_id, disposition, created_at)
       VALUES (:id, :runId, :limsId, :label, :backendRoleId, :disposition, :now)`,
      {
        transaction: t,
        replacements: {
          id: crypto.randomUUID(),
          runId: options.runId,
          now,
          ...row
        }
      }
    );

  for (const role of plan.roles) {
    if (role.action === "map_to_master_admin") {
      await recordMap({
        limsId: role.limsRoleId,
        label: role.limsName,
        backendRoleId: role.backendRoleId,
        disposition: "mapped_to_existing"
      });
      continue;
    }

    if (role.action === "create") {
      await sequelize.query(
        `INSERT INTO roles (id, name, type, deleted_at, created_at, updated_at)
         VALUES (:id, :name, :type, :deletedAt, :now, :now)`,
        {
          transaction: t,
          replacements: {
            id: role.backendRoleId,
            name: role.limsName,
            type: LIMS_SERVICE_ROLE_TYPE,
            deletedAt: role.deletedAt,
            now
          }
        }
      );
      await grant(role.backendRoleId, role.permissions);
      await recordMap({
        limsId: role.limsRoleId,
        label: role.limsName,
        backendRoleId: role.backendRoleId,
        disposition: "created"
      });
      await recordRbacChange(
        {
          actor,
          action: options.action,
          targetType: "role",
          targetId: role.backendRoleId,
          targetName: role.limsName,
          afterState: {
            name: role.limsName,
            type: LIMS_SERVICE_ROLE_TYPE,
            permissions: role.permissions,
            deleted: !!role.deletedAt,
            limsRoleId: role.limsRoleId,
            limsRoleCode: role.roleCode
          },
          reason: options.reason
        },
        t
      );
      continue;
    }

    if (role.action === "sync" && role.changes) {
      const c = role.changes;
      const [before] = await select<{ name: string; deleted: boolean }>(
        `SELECT name, deleted_at IS NOT NULL AS deleted FROM roles WHERE id = :id`,
        { id: role.backendRoleId },
        t
      );

      // LIMS is the source of truth for both the name and the deleted state.
      await sequelize.query(
        `UPDATE roles SET name = :name, deleted_at = :deletedAt, updated_at = :now WHERE id = :id`,
        {
          transaction: t,
          replacements: {
            id: role.backendRoleId,
            name: role.limsName,
            deletedAt: role.deletedAt,
            now
          }
        }
      );
      if (c.revoke.length) {
        await sequelize.query(
          `DELETE FROM role_permissions
            WHERE role_id = :roleId
              AND permission_id IN (SELECT id FROM permissions WHERE name IN (:names))`,
          {
            transaction: t,
            replacements: { roleId: role.backendRoleId, names: c.revoke }
          }
        );
      }
      await grant(role.backendRoleId, c.grant);

      await recordRbacChange(
        {
          actor,
          action: options.action,
          targetType: "role",
          targetId: role.backendRoleId,
          targetName: role.limsName,
          beforeState: {
            name: before.name,
            deleted: before.deleted,
            permissions: role.permissions
              .filter((p) => !c.grant.includes(p))
              .concat(c.revoke)
              .sort()
          },
          afterState: {
            name: role.limsName,
            deleted: !!role.deletedAt,
            permissions: role.permissions,
            limsRoleId: role.limsRoleId,
            limsRoleCode: role.roleCode
          },
          reason: options.reason
        },
        t
      );
    }
  }
};

export class LimsRoleSyncBlocked extends Error {
  statusCode = 409;
  constructor(public blockers: Blocker[]) {
    super(blockers.map((b) => b.detail).join(" "));
  }
}

/** The live mirror: lims-service sends its full set of Lab Roles and backend converges on
 * it. Throws LimsRoleSyncBlocked (409) rather than applying a partial sync. */
export const syncLimsRoles = async (
  input: { roles: LimsRoleRow[]; entries: LimsEntryRow[] },
  options: { actor?: Pick<IUser, "id" | "email">; reason: string }
) => {
  const t = await sequelize.transaction();
  let plan: MigrationPlan;
  try {
    plan = buildMigrationPlan(
      input.roles,
      input.entries,
      await loadBackendState(true, t)
    );
    if (plan.blockers.length) throw new LimsRoleSyncBlocked(plan.blockers);

    await applyPlan(
      plan,
      {
        runId: crypto.randomUUID(),
        reason: options.reason,
        action: "LIMS_ROLE_SYNC",
        actor: options.actor
      },
      t
    );
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  const changed = plan.roles.filter((r) => r.action !== "in_sync");
  if (changed.length) await publishRbacInvalidation({ scope: "all" });

  return {
    pointers: plan.roles.map((r) => ({
      limsRoleId: r.limsRoleId,
      backendRoleId: r.backendRoleId
    })),
    changed: changed.map((r) => ({
      limsRoleId: r.limsRoleId,
      action: r.action
    }))
  };
};
