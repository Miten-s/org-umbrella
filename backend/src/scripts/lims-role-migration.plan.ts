import crypto from "crypto";

/** Pure planning logic for migrate-lims-roles.ts — takes everything already loaded from
 * both databases and decides what would be written, with no I/O of its own. Kept separate
 * so every safety rule below is testable without a database.
 *
 * Moves Lab Role DEFINITIONS to backend, the model GXP already uses. Assignments stay in
 * lims_user_roles; each LIMS role is pointed at its backend copy via
 * lims_roles.backend_role_id. Re-runnable: roles already migrated are synced to match
 * LIMS, so the dual-read can converge while lab managers keep editing roles in LIMS. */

/** Must stay identical to lims-service/src/utils/permissions.ts. Backend's rootDir forbids
 * importing it, so this is a copy — lims-role-migration.plan.test.ts reads lims-service's
 * source and fails if the two ever diverge. */
export const LIMS_ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE"] as const;
export type LimsAction = (typeof LIMS_ACTIONS)[number];

export const ACTION_COLUMN: Record<
  LimsAction,
  "canView" | "canCreate" | "canEdit" | "canRemove"
> = {
  VIEW: "canView",
  CREATE: "canCreate",
  UPDATE: "canEdit",
  DELETE: "canRemove"
};

/** LIMS's own wildcard constant is the bare "OPERATE:ALL" — byte-identical to the
 * platform's super-admin permission. operate_all must land on the namespaced one. */
export const LIMS_OPERATE_ALL = "LIMS:OPERATE:ALL";
export const PLATFORM_OPERATE_ALL = "OPERATE:ALL";

export const LIMS_MASTER_ADMIN_CODE = "LIMS_MASTER_ADMIN";
export const BACKEND_LIMS_MASTER_ADMIN_NAME = "LIMS Master Admin";
export const LIMS_SERVICE_ROLE_TYPE = "Lims_Service";

export interface LimsRoleRow {
  id: string;
  roleCode: string;
  name: string;
  operateAll: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  /** lims_roles.backend_role_id as it stands now. */
  backendRoleId: string | null;
}

export interface LimsEntryRow {
  roleId: string;
  entry: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canRemove: boolean;
}

export interface BackendRole {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  permissions: string[];
}

export interface BackendState {
  permissionIdsByName: Map<string, string>;
  /** Every backend role, soft-deleted included: roles.name is unique across both. */
  rolesByName: Map<string, BackendRole>;
  rolesById: Map<string, BackendRole>;
  /** lims role id -> backend role id, from lims_role_migration_map */
  alreadyMigrated: Map<string, string>;
}

export type RoleAction = "create" | "map_to_master_admin" | "sync" | "in_sync";

export interface RoleChanges {
  rename?: { from: string; to: string };
  grant: string[];
  revoke: string[];
  softDelete?: boolean;
  restore?: boolean;
}

export interface RolePlan {
  limsRoleId: string;
  limsName: string;
  roleCode: string;
  action: RoleAction;
  backendRoleId: string;
  deletedAt: Date | null;
  permissions: string[];
  /** Only for "sync". */
  changes?: RoleChanges;
  /** lims_roles.backend_role_id needs (re)writing. */
  pointerWrite: boolean;
}

export interface Blocker {
  kind:
    | "name_collision"
    | "duplicate_lims_name"
    | "unknown_permission"
    | "bare_operate_all"
    | "master_admin_missing"
    | "migrated_role_missing";
  detail: string;
}

export interface MigrationPlan {
  roles: RolePlan[];
  blockers: Blocker[];
  warnings: string[];
}

/** Deterministic, so a dry run reports the exact ids a real run will write. The
 * version/variant nibbles are set because lims-service's own @IsUUID("4") validation once
 * rejected a hash-shaped id (see its migration 015). */
export const deterministicUuid = (seed: string): string => {
  const h = crypto.createHash("sha256").update(seed).digest("hex").split("");
  h[12] = "4";
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
};

export const permissionsForEntries = (entries: LimsEntryRow[]): string[] => {
  const names = new Set<string>();
  for (const entry of entries) {
    for (const action of LIMS_ACTIONS) {
      if (entry[ACTION_COLUMN[action]]) {
        names.add(`LIMS:${action}:${entry.entry}`);
      }
    }
  }
  return [...names].sort();
};

export const buildMigrationPlan = (
  limsRoles: LimsRoleRow[],
  limsEntries: LimsEntryRow[],
  backend: BackendState
): MigrationPlan => {
  const blockers: Blocker[] = [];
  const warnings: string[] = [];
  const roles: RolePlan[] = [];

  const entriesByRole = new Map<string, LimsEntryRow[]>();
  for (const entry of limsEntries) {
    const list = entriesByRole.get(entry.roleId) ?? [];
    list.push(entry);
    entriesByRole.set(entry.roleId, list);
  }

  // Two LIMS roles sharing a name would both target the same backend name.
  const nameCounts = new Map<string, number>();
  for (const role of limsRoles) {
    if (role.roleCode === LIMS_MASTER_ADMIN_CODE) continue;
    nameCounts.set(role.name, (nameCounts.get(role.name) ?? 0) + 1);
  }
  for (const [name, count] of nameCounts) {
    if (count > 1) {
      blockers.push({
        kind: "duplicate_lims_name",
        detail: `${count} LIMS roles are named "${name}"; backend role names must be unique.`
      });
    }
  }

  for (const role of limsRoles) {
    const entryPermissions = permissionsForEntries(entriesByRole.get(role.id) ?? []);
    const permissions = role.operateAll
      ? [LIMS_OPERATE_ALL, ...entryPermissions].sort()
      : entryPermissions;

    if (permissions.includes(PLATFORM_OPERATE_ALL)) {
      blockers.push({
        kind: "bare_operate_all",
        detail: `Role "${role.name}" would be granted the platform super-admin permission.`
      });
    }
    for (const name of permissions) {
      if (!backend.permissionIdsByName.has(name)) {
        blockers.push({
          kind: "unknown_permission",
          detail: `Role "${role.name}" needs "${name}", which is not in backend's catalogue.`
        });
      }
    }

    const deletedAt = role.isDeleted ? (role.deletedAt ?? new Date(0)) : null;
    const base = {
      limsRoleId: role.id,
      limsName: role.name,
      roleCode: role.roleCode,
      deletedAt,
      permissions
    };

    // The seeded role is a protected fixture holding only the wildcard; it is pointed at,
    // never modified.
    if (role.roleCode === LIMS_MASTER_ADMIN_CODE) {
      const seeded = backend.rolesByName.get(BACKEND_LIMS_MASTER_ADMIN_NAME);
      if (!seeded || seeded.deleted || seeded.type !== LIMS_SERVICE_ROLE_TYPE) {
        blockers.push({
          kind: "master_admin_missing",
          detail: `Backend has no active Lims_Service role "${BACKEND_LIMS_MASTER_ADMIN_NAME}" — migration 022 has not been applied.`
        });
        continue;
      }
      roles.push({
        ...base,
        action: backend.alreadyMigrated.has(role.id) ? "in_sync" : "map_to_master_admin",
        backendRoleId: seeded.id,
        deletedAt: null,
        permissions: [LIMS_OPERATE_ALL],
        pointerWrite: role.backendRoleId !== seeded.id
      });
      continue;
    }

    const migratedId = backend.alreadyMigrated.get(role.id);
    if (migratedId) {
      const current = backend.rolesById.get(migratedId);
      if (!current) {
        blockers.push({
          kind: "migrated_role_missing",
          detail: `"${role.name}" was migrated to backend role ${migratedId}, which no longer exists.`
        });
        continue;
      }

      const changes: RoleChanges = {
        grant: permissions.filter((p) => !current.permissions.includes(p)),
        revoke: current.permissions.filter((p) => !permissions.includes(p))
      };
      if (current.name !== role.name) {
        const clash = backend.rolesByName.get(role.name);
        if (clash && clash.id !== migratedId) {
          blockers.push({
            kind: "name_collision",
            detail: `LIMS role renamed to "${role.name}", which an existing backend ${clash.type} role already uses${clash.deleted ? " (soft-deleted — still reserves the name)" : ""}.`
          });
          continue;
        }
        changes.rename = { from: current.name, to: role.name };
      }
      if (role.isDeleted && !current.deleted) changes.softDelete = true;
      if (!role.isDeleted && current.deleted) changes.restore = true;

      const changed =
        !!changes.rename ||
        changes.grant.length > 0 ||
        changes.revoke.length > 0 ||
        !!changes.softDelete ||
        !!changes.restore;

      roles.push({
        ...base,
        action: changed ? "sync" : "in_sync",
        backendRoleId: migratedId,
        changes: changed ? changes : undefined,
        pointerWrite: role.backendRoleId !== migratedId
      });
      continue;
    }

    const clash = backend.rolesByName.get(role.name);
    if (clash) {
      blockers.push({
        kind: "name_collision",
        detail: `LIMS role "${role.name}" collides with an existing backend ${clash.type} role${clash.deleted ? " (soft-deleted — still reserves the name)" : ""}.`
      });
      continue;
    }

    if (role.isDeleted) {
      warnings.push(
        `Soft-deleted role "${role.name}" is carried across as deleted. roles.name is unique across deleted rows too, so this name becomes permanently unavailable in backend.`
      );
    }

    const backendRoleId = deterministicUuid(`lims-role:${role.id}`);
    roles.push({
      ...base,
      action: "create",
      backendRoleId,
      pointerWrite: role.backendRoleId !== backendRoleId
    });
  }

  return { roles, blockers, warnings };
};
