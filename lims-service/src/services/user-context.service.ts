import { QueryTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import cache from "../configs/cache";
import LimsUser from "../models/lims-user.model";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import Group from "../models/group.model";
import { ACTION_COLUMN, LimsAction } from "../utils/permissions";
import ENV from "../utils/environment";
import { logError, logInfo, logWarn } from "../configs/logger.config";
import { isPlatformSuperAdmin } from "./platform-access.service";
import { fetchPermissionsForRoleIds } from "./backend-permissions.client";
import {
  PermissionSource,
  ResolvedPermissions,
  comparePermissions,
  fromBackendPermissions,
  parsePermissionSource
} from "./permission-parity";

/** Resolves the JWT's platform user id into everything the access layer needs — cached,
 * since it's four joins plus a recursive walk. */
export interface UserContext {
  /** lims_users.id — not the platform user id. */
  limsUserId: string;
  platformUserId: string;
  userName: string | null;
  /** Home group: stamped on records this user creates. */
  homeGroupId: string | null;
  /** Access groups, already expanded down the hierarchy. */
  accessGroupIds: string[];
  /** True if any role grants OPERATE:ALL — bypasses group filtering. */
  operateAll: boolean;
  /** Granted permission codes, e.g. "LIMS:CREATE:SAMPLE". Union across roles. */
  permissions: Set<string>;
}

const CACHE_PREFIX = "user-ctx:";
const key = (platformUserId: string) => `${CACHE_PREFIX}${platformUserId}`;

/** Bounds staleness of platform Super Admin status — see CacheStore's ttlSeconds doc. */
const SUPER_ADMIN_STALENESS_TTL_SECONDS = 5 * 60;

/** Whenever backend is consulted, bounds how long a missed rbac:invalidate message can
 * leave a cached context stale. Local changes are still invalidated on write. */
const BACKEND_STALENESS_TTL_SECONDS = 5 * 60;

/** The last backend-confirmed context, kept longer than the primary entry so reads can
 * ride out a backend outage. Same budget and rule as gxp-service: reads only, 30 minutes. */
const GRACE_CACHE_PREFIX = "user-ctx-grace:";
const graceKey = (platformUserId: string) =>
  `${GRACE_CACHE_PREFIX}${platformUserId}`;
const GRACE_TTL_SECONDS = 30 * 60;

/** Backend holds what roles grant, and it cannot be reached. Deliberately not a 403: the
 * user may well have access, LIMS just cannot confirm it right now. */
export class PermissionsUnavailable extends Error {
  statusCode = 503;
  constructor() {
    super(
      "LIMS permissions are temporarily unavailable. Please try again shortly."
    );
  }
}

let warnedAboutSource = false;

const permissionSource = (): PermissionSource => {
  const raw = ENV.LIMS_PERMISSION_SOURCE;
  const source = parsePermissionSource(raw);
  if (raw && raw !== source && !warnedAboutSource) {
    warnedAboutSource = true;
    logError(
      `Unrecognised LIMS_PERMISSION_SOURCE "${raw}" — using "local"`,
      null,
      "permissionSource"
    );
  }
  return source;
};

/** Cached shape — a Set does not survive JSON, so permissions travel as an array. */
interface CachedContext extends Omit<UserContext, "permissions"> {
  permissions: string[];
}

/** Expands group ids to every descendant, so access cascades. A recursive CTE, not an
 * application-side loop — depth is unknown, and one query beats N round trips. */
export const expandGroupIds = async (groupIds: string[]): Promise<string[]> => {
  if (!groupIds.length) return [];

  const rows = await sequelize.query<{ id: string }>(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM lims_groups
        WHERE id IN (:groupIds) AND is_deleted = false
       UNION
       SELECT child.id FROM lims_groups child
         JOIN descendants parent ON child.parent_group_id = parent.id
        WHERE child.is_deleted = false
     )
     SELECT id FROM descendants`,
    { replacements: { groupIds }, type: QueryTypes.SELECT }
  );

  return rows.map((row) => row.id);
};

/** Turns a role's entry rows into permission codes, unioned across roles. */
export const permissionsFromRoles = (
  roles: (Role & { entries?: RoleEntry[] })[]
): { permissions: Set<string>; operateAll: boolean } => {
  const permissions = new Set<string>();
  let operateAll = false;

  for (const role of roles) {
    if (role.operateAll) operateAll = true;

    for (const entry of role.entries ?? []) {
      for (const [action, column] of Object.entries(ACTION_COLUMN)) {
        if (entry[column]) permissions.add(`LIMS:${action}:${entry.entry}`);
      }
    }
  }

  return { permissions, operateAll };
};

/** Resolves a set of Lab Role ids (as sent by a Lab User's `roles` field) to the permission
 * codes they'd grant — used to check role *assignment* isn't itself an escalation, the same
 * way role *definition* is checked in role-escalation.middleware.ts. */
export const permissionCodesForRoleIds = async (
  roleIds: string[]
): Promise<{ permissions: Set<string>; operateAll: boolean }> => {
  if (!roleIds.length) return { permissions: new Set(), operateAll: false };

  const roles = (await Role.findAll({
    where: { id: roleIds, isDeleted: false },
    include: [{ model: RoleEntry, as: "entries", required: false }]
  })) as (Role & { entries?: RoleEntry[] })[];

  return permissionsFromRoles(roles);
};

/** Returns null when the platform user has no lims_users row — a valid platform token is
 * not by itself LIMS access.
 *
 * `allowGrace` (default true) only matters in "backend" mode, when backend is unreachable:
 * a read may then use the last backend-confirmed permissions for up to GRACE_TTL_SECONDS;
 * a write may not, and gets PermissionsUnavailable. authorize() passes it per action. */
export const getUserContext = async (
  platformUserId: string,
  options: { allowGrace?: boolean } = {}
): Promise<UserContext | null> => {
  const { allowGrace = true } = options;
  const cached = await cache.get<CachedContext>(key(platformUserId));
  if (cached) return { ...cached, permissions: new Set(cached.permissions) };

  // Super Admin has full access to every service without needing a lims_users row.
  if (await isPlatformSuperAdmin(platformUserId)) {
    const context: UserContext = {
      limsUserId: "",
      platformUserId,
      userName: null,
      homeGroupId: null,
      accessGroupIds: [],
      operateAll: true,
      permissions: new Set()
    };
    await cache.set<CachedContext>(
      key(platformUserId),
      { ...context, permissions: [] },
      SUPER_ADMIN_STALENESS_TTL_SECONDS
    );
    return context;
  }

  const limsUser = (await LimsUser.findOne({
    where: { userId: platformUserId, isDeleted: false },
    include: [
      {
        model: Role,
        as: "roles",
        required: false,
        where: { isDeleted: false },
        include: [{ model: RoleEntry, as: "entries", required: false }]
      },
      {
        model: Group,
        as: "accessGroups",
        required: false,
        where: { isDeleted: false }
      }
    ]
  })) as (LimsUser & { roles?: Role[]; accessGroups?: Group[] }) | null;

  if (!limsUser) return null;

  const source = permissionSource();
  const assignedRoles = (limsUser.roles ?? []) as (Role & {
    entries?: RoleEntry[];
  })[];
  const local = permissionsFromRoles(assignedRoles);
  let { permissions, operateAll } = local;

  if (source === "backend") {
    // Only roles with a backend copy can grant anything here. One without it is a gap in
    // the mirror — it must not silently fall back to LIMS's own definition.
    const unmigrated = assignedRoles.filter((role) => !role.backendRoleId);
    if (unmigrated.length) {
      logError(
        "LIMS role(s) with no backend copy grant nothing in backend mode",
        { platformUserId, roles: unmigrated.map((role) => role.name) },
        "getUserContext"
      );
    }

    const backend = await resolveViaBackend(
      assignedRoles
        .filter((role) => role.backendRoleId)
        .map((role) => ({ name: role.name, backendRoleId: role.backendRoleId }))
    );

    if (backend.status !== "resolved") {
      logWarn(
        `LIMS: backend unreachable while resolving permissions (allowGrace=${allowGrace})`,
        { platformUserId },
        "getUserContext"
      );
      if (allowGrace) {
        const grace = await cache.get<CachedContext>(graceKey(platformUserId));
        if (grace) return { ...grace, permissions: new Set(grace.permissions) };
      }
      throw new PermissionsUnavailable();
    }

    // LIMS's own calculation is no longer enforced, but it still exists — a difference
    // means the mirror has fallen behind.
    const parity = comparePermissions(local, backend.permissions);
    if (!parity.match) {
      logWarn(
        "LIMS permission mismatch",
        { platformUserId, ...parity },
        "getUserContext"
      );
    }

    ({ permissions, operateAll } = backend.permissions);
  }

  // The home group is implicitly accessible — you can always see what you make.
  const directGroupIds = [
    ...(limsUser.accessGroups ?? []).map((group) => group.id),
    ...(limsUser.groupId ? [limsUser.groupId] : [])
  ];

  const context: UserContext = {
    limsUserId: limsUser.id,
    platformUserId,
    userName: limsUser.userName ?? null,
    homeGroupId: limsUser.groupId,
    accessGroupIds: await expandGroupIds([...new Set(directGroupIds)]),
    operateAll,
    permissions
  };

  const cachedShape: CachedContext = {
    ...context,
    permissions: [...permissions]
  };

  await cache.set<CachedContext>(
    key(platformUserId),
    cachedShape,
    source === "local" ? undefined : BACKEND_STALENESS_TTL_SECONDS
  );
  if (source === "backend") {
    await cache.set<CachedContext>(
      graceKey(platformUserId),
      cachedShape,
      GRACE_TTL_SECONDS
    );
  }

  // Enforcement above used LIMS's own data; this only observes. Deliberately not awaited:
  // it must never add latency to the request or fail it, even if backend is down.
  if (source === "dual") {
    void compareWithBackend(
      platformUserId,
      { permissions, operateAll },
      assignedRoles.map((role) => ({
        name: role.name,
        backendRoleId: role.backendRoleId ?? null
      }))
    );
  }

  return context;
};

export interface AssignedRole {
  name: string;
  backendRoleId: string | null;
}

export type BackendResolution =
  | { status: "unmigrated"; roleNames: string[] }
  | { status: "unreachable" }
  | { status: "resolved"; permissions: ResolvedPermissions };

/** What the user's LIMS-assigned roles grant according to backend — the way gxp-service
 * resolves gxp_users.roles. Assignments stay in LIMS; only the definitions come from
 * backend, found through lims_roles.backend_role_id. */
export const resolveViaBackend = async (
  roles: AssignedRole[]
): Promise<BackendResolution> => {
  const unmigrated = roles
    .filter((role) => !role.backendRoleId)
    .map((role) => role.name);
  if (unmigrated.length) return { status: "unmigrated", roleNames: unmigrated };

  const result = await fetchPermissionsForRoleIds(
    roles.map((role) => role.backendRoleId as string)
  );
  if (!result.ok) return { status: "unreachable" };
  return {
    status: "resolved",
    permissions: fromBackendPermissions(result.permissions)
  };
};

/** The C6 dual-read. Resolves the same user through backend and logs whether the two
 * agree. Matches are logged too, so "zero mismatches" is evidence rather than silence. */
export const compareWithBackend = async (
  platformUserId: string,
  local: ResolvedPermissions,
  roles: AssignedRole[]
): Promise<void> => {
  try {
    const backend = await resolveViaBackend(roles);

    if (backend.status === "unreachable") {
      logWarn(
        "LIMS dual-read: backend unreachable, comparison skipped",
        { platformUserId },
        "compareWithBackend"
      );
      return;
    }
    // After the cutover a role with no backend copy would grant nothing — a real
    // difference, so it counts as a mismatch rather than being skipped.
    if (backend.status === "unmigrated") {
      logWarn(
        "LIMS permission mismatch",
        { platformUserId, unmigratedRoles: backend.roleNames },
        "compareWithBackend"
      );
      return;
    }

    const parity = comparePermissions(local, backend.permissions);
    if (parity.match) {
      logInfo(
        "LIMS permission parity ok",
        { platformUserId },
        "compareWithBackend"
      );
    } else {
      logWarn(
        "LIMS permission mismatch",
        { platformUserId, ...parity },
        "compareWithBackend"
      );
    }
  } catch (error) {
    logError(
      "LIMS dual-read comparison failed",
      { platformUserId, error: String(error) },
      "compareWithBackend"
    );
  }
};

export const hasPermission = (
  context: UserContext,
  action: LimsAction,
  entity: string
): boolean =>
  context.operateAll || context.permissions.has(`LIMS:${action}:${entity}`);

// ---------------------------------------------------------------------------
// Invalidation — called on write, never left to a TTL.
// ---------------------------------------------------------------------------

/** One user's access changed (their lims_users row, roles or access groups). */
export const invalidateUserContext = async (platformUserId: string) => {
  // The grace copy too — otherwise a failed refresh right after a revocation could still
  // serve the pre-change permissions from it.
  await Promise.all([
    cache.del(key(platformUserId)),
    cache.del(graceKey(platformUserId))
  ]);
};

/** A role/group changed, unknown users affected — drops every cached context; roles/groups
 * change rarely, and recomputing a few costs far less than serving a stale permission. */
export const invalidateAllUserContexts = async () => {
  await Promise.all([
    cache.delPrefix(CACHE_PREFIX),
    cache.delPrefix(GRACE_CACHE_PREFIX)
  ]);
};
