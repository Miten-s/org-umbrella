import { QueryTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import cache from "../configs/cache";
import LimsUser from "../models/lims-user.model";
import UserRole from "../models/user-role.model";
import Group from "../models/group.model";
import { LimsAction } from "../utils/permissions";
import { logWarn } from "../configs/logger.config";
import { platformSuperAdminStatus } from "./platform-access.service";
import { fetchPermissionsForRoleIds } from "./backend-permissions.client";

/** Resolves the JWT's platform user id into everything the access layer needs — cached,
 * since it takes a database read, a call to backend and a recursive group walk. */
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

/** Bounds how long a missed rbac:invalidate message can leave a cached context stale.
 * Changes made in LIMS itself are still invalidated on write. */
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

export const LIMS_OPERATE_ALL = "LIMS:OPERATE:ALL";

export interface ResolvedPermissions {
  permissions: Set<string>;
  operateAll: boolean;
}

/** Backend answers with every permission the given roles hold. Only LIMS ones count here,
 * and "LIMS:OPERATE:ALL" is LIMS's wildcard. Platform Super Admin is handled separately. */
export const fromBackendPermissions = (
  names: string[]
): ResolvedPermissions => {
  const lims = names.filter((name) => name.startsWith("LIMS:"));
  return {
    operateAll: lims.includes(LIMS_OPERATE_ALL),
    permissions: new Set(lims.filter((name) => name !== LIMS_OPERATE_ALL))
  };
};

/** What a set of Lab Role ids (backend role ids) would grant — used to check that role
 * *assignment* isn't itself an escalation. Throws PermissionsUnavailable when backend
 * can't answer: an unverifiable role must not be treated as granting nothing. */
export const permissionCodesForRoleIds = async (
  roleIds: string[]
): Promise<ResolvedPermissions> => {
  if (!roleIds.length) return { permissions: new Set(), operateAll: false };
  const result = await fetchPermissionsForRoleIds(roleIds);
  if (!result.ok) throw new PermissionsUnavailable();
  return fromBackendPermissions(result.permissions);
};

/** Returns null when the platform user has no lims_users row — a valid platform token is
 * not by itself LIMS access.
 *
 * What the user's roles grant comes from backend. When backend is unreachable, a read
 * (`allowGrace`, the default) may use the last confirmed permissions for up to
 * GRACE_TTL_SECONDS; a write may not, and gets PermissionsUnavailable. authorize() passes
 * it per action. */
export const getUserContext = async (
  platformUserId: string,
  options: { allowGrace?: boolean } = {}
): Promise<UserContext | null> => {
  const { allowGrace = true } = options;
  const cached = await cache.get<CachedContext>(key(platformUserId));
  if (cached) return { ...cached, permissions: new Set(cached.permissions) };

  // Super Admin has full access to every service without needing a lims_users row.
  const superAdmin = await platformSuperAdminStatus(platformUserId);
  if (superAdmin === "unknown" && allowGrace) {
    // Only a Super Admin's grace copy is used here; anyone else resolves below.
    const grace = await cache.get<CachedContext>(graceKey(platformUserId));
    if (grace?.operateAll && !grace.limsUserId) {
      return { ...grace, permissions: new Set(grace.permissions) };
    }
  }
  if (superAdmin === "yes") {
    const context: UserContext = {
      limsUserId: "",
      platformUserId,
      userName: null,
      homeGroupId: null,
      accessGroupIds: [],
      operateAll: true,
      permissions: new Set()
    };
    const cachedShape: CachedContext = { ...context, permissions: [] };
    await Promise.all([
      cache.set(
        key(platformUserId),
        cachedShape,
        SUPER_ADMIN_STALENESS_TTL_SECONDS
      ),
      cache.set(graceKey(platformUserId), cachedShape, GRACE_TTL_SECONDS)
    ]);
    return context;
  }

  const limsUser = (await LimsUser.findOne({
    where: { userId: platformUserId, isDeleted: false },
    include: [
      { model: UserRole, as: "roleLinks", required: false },
      {
        model: Group,
        as: "accessGroups",
        required: false,
        where: { isDeleted: false }
      }
    ]
  })) as (LimsUser & { roleLinks?: UserRole[]; accessGroups?: Group[] }) | null;

  if (!limsUser) {
    // Without backend there is no telling whether this is a Super Admin.
    if (superAdmin === "unknown") throw new PermissionsUnavailable();
    return null;
  }

  const roleIds = (limsUser.roleLinks ?? []).map((link) => link.roleId);
  const result = await fetchPermissionsForRoleIds(roleIds);
  if (!result.ok) {
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
  const { permissions, operateAll } = fromBackendPermissions(
    result.permissions
  );

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

  await Promise.all([
    cache.set(key(platformUserId), cachedShape, BACKEND_STALENESS_TTL_SECONDS),
    cache.set(graceKey(platformUserId), cachedShape, GRACE_TTL_SECONDS)
  ]);

  return context;
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
