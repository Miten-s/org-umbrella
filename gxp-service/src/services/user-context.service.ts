import { QueryTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import cache from "../configs/cache";
import GxpUser from "../models/gxp-service-users.model";
import { Group } from "../models/gxp-service-group.model";
import {
  fetchPermissionsForUser,
  fetchPermissionsForRoleIds
} from "./backend-permissions.client";

/** Resolves the JWT's platform user id into everything GXP's access layer needs — cached,
 * since it's a GxpUser lookup plus a backend permissions-API call. Mirrors
 * lims-service/src/services/user-context.service.ts. */
export interface GxpUserContext {
  gxpUserId: string;
  platformUserId: string;
  userName: string | null;
  /** True for the platform's Super Admin (OPERATE:ALL) — full access without a GxpUser row. */
  isSuperAdmin: boolean;
  /** Granted permission codes, e.g. "GXP:CREATE:APPLICATION". Union across roles. */
  permissions: Set<string>;
  /** Home group plus explicit access grants, expanded down the group hierarchy. Not yet
   * consulted by any domain entity — applications/service_requests have no group_id column
   * of their own yet — but resolved here so scoping can be turned on per-entity without
   * another round of context-layer changes. */
  accessGroupIds: string[];
}

/** Expands a set of group ids to include every descendant group — access to a parent
 * cascades down (mirrors lims-service's expandGroupIds()). */
export const expandGroupIds = async (groupIds: string[]): Promise<string[]> => {
  if (!groupIds.length) return [];

  const rows = await sequelize.query<{ id: string }>(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM gxp_groups
        WHERE id IN (:groupIds) AND status = 'enabled'
       UNION
       SELECT child.id FROM gxp_groups child
         JOIN descendants parent ON child.parent_group_id = parent.id
        WHERE child.status = 'enabled'
     )
     SELECT id FROM descendants`,
    { replacements: { groupIds }, type: QueryTypes.SELECT }
  );

  return rows.map((row) => row.id);
};

const CACHE_PREFIX = "gxp-user-ctx:";
const GRACE_CACHE_PREFIX = "gxp-user-ctx-grace:";
const key = (platformUserId: string) => `${CACHE_PREFIX}${platformUserId}`;
const graceKey = (platformUserId: string) =>
  `${GRACE_CACHE_PREFIX}${platformUserId}`;

/** Bounds staleness of a Gxp_Service role's permissions, which change on the platform's
 * own Roles screen with no invalidation channel back here — membership changes made in
 * gxp-service itself still invalidate immediately via invalidateUserContext below. Also
 * the cadence at which a fresh call to backend is attempted. */
const PERMISSION_STALENESS_TTL_SECONDS = 5 * 60;

/** GXP has no local permission model to fall back on — unlike lims-service, where only the
 * Super Admin flag depends on backend and a normal user's access still resolves from its
 * own local roles. Here, backend being briefly unreachable must not zero out every user's
 * access outright: while the primary cache above is fresh we never call backend at all, but
 * once it's due for a refresh and that refresh fails, we serve this longer-lived "last
 * confirmed good" value instead of denying immediately. It still expires — an outage must
 * eventually degrade to deny, not grant access forever off a possibly-revoked permission
 * set — just on a much longer horizon than the routine 5-minute refresh cadence. */
const GRACE_TTL_SECONDS = 30 * 60;

interface CachedContext extends Omit<GxpUserContext, "permissions"> {
  permissions: string[];
}

const toContext = (cached: CachedContext): GxpUserContext => ({
  ...cached,
  permissions: new Set(cached.permissions)
});

const emptyContext = (
  gxpUser: GxpUser,
  platformUserId: string
): GxpUserContext => ({
  gxpUserId: gxpUser.id,
  platformUserId,
  userName: gxpUser.userName ?? null,
  isSuperAdmin: false,
  permissions: new Set(),
  accessGroupIds: []
});

/** Returns null when the platform user has neither Super Admin nor a gxp_users row — a
 * valid platform token is not by itself GXP access (same rule as LIMS).
 *
 * `allowGrace` (default true) gates whether a failed refresh may fall back to the grace
 * cache. Reads (VIEW) tolerate up to GRACE_TTL_SECONDS of staleness — low stakes, and
 * reversible if wrong. Writes (CREATE/UPDATE/DELETE) must not: acting on a permission set
 * that might have been revoked during the outage has a lasting, irreversible effect, so
 * authorize() passes `allowGrace: false` for anything but VIEW — a reachability failure on
 * a write denies immediately regardless of what's cached in the grace store. */
export const getGxpUserContext = async (
  platformUserId: string,
  options: { allowGrace?: boolean } = {}
): Promise<GxpUserContext | null> => {
  const { allowGrace = true } = options;

  const cached = await cache.get<CachedContext>(key(platformUserId));
  if (cached) return toContext(cached);

  const [superAdminResult, gxpUser] = await Promise.all([
    fetchPermissionsForUser(platformUserId),
    GxpUser.findOne({
      where: { authUserId: platformUserId, status: "enabled" },
      include: [{ model: Group, as: "accessGroups", required: false }]
    }) as Promise<(GxpUser & { accessGroups?: Group[] }) | null>
  ]);

  const permissionsResult = gxpUser
    ? await fetchPermissionsForRoleIds(gxpUser.roles ?? [])
    : { ok: true as const, permissions: [] as string[] };

  if (!superAdminResult.ok || !permissionsResult.ok) {
    console.error(
      `gxp-service: backend permissions API unreachable while refreshing context for ${platformUserId} (allowGrace=${allowGrace})`
    );

    if (allowGrace) {
      // Serve the last confirmed-good context if it's still within the grace window,
      // rather than wiping this user's access to zero on a transient blip. Only a true
      // miss (never cached, or grace window also elapsed) denies.
      const grace = await cache.get<CachedContext>(graceKey(platformUserId));
      if (grace) return toContext(grace);
    }

    if (!gxpUser) return null;
    return emptyContext(gxpUser, platformUserId);
  }

  const superAdmin = superAdminResult.permissions.includes("OPERATE:ALL");
  if (!superAdmin && !gxpUser) return null;

  const permissions = new Set(permissionsResult.permissions);

  // Home group is implicitly accessible — a user can always see what they'd be assigned to
  // by default — plus whatever's been explicitly granted, expanded down the hierarchy.
  const directGroupIds = [
    ...(gxpUser?.accessGroups ?? []).map((group) => group.id),
    ...(gxpUser?.groupId ? [gxpUser.groupId] : [])
  ];

  const context: GxpUserContext = {
    gxpUserId: gxpUser?.id ?? "",
    platformUserId,
    userName: gxpUser?.userName ?? null,
    isSuperAdmin: superAdmin,
    permissions,
    accessGroupIds: await expandGroupIds([...new Set(directGroupIds)])
  };

  const cachedShape: CachedContext = {
    ...context,
    permissions: [...permissions]
  };
  await Promise.all([
    cache.set(
      key(platformUserId),
      cachedShape,
      PERMISSION_STALENESS_TTL_SECONDS
    ),
    cache.set(graceKey(platformUserId), cachedShape, GRACE_TTL_SECONDS)
  ]);

  return context;
};

/** `GXP:OPERATE:ALL` is a service-scoped wildcard — full GXP access without being the
 * platform's Super Admin (which is `OPERATE:ALL`, a distinct string, checked separately
 * via `isSuperAdmin`). See backend/src/migrations/018-seed-gxp-master-admin-role.ts. */
export const hasPermission = (context: GxpUserContext, code: string): boolean =>
  context.isSuperAdmin ||
  context.permissions.has("GXP:OPERATE:ALL") ||
  context.permissions.has(code);

// ---------------------------------------------------------------------------
// Invalidation — called on write, never left to a TTL.
// ---------------------------------------------------------------------------

/** One user's access changed (their gxp_users row or role assignment). Drops the grace
 * cache too — otherwise a failed refresh immediately after this change could still serve
 * the pre-change permission set from the grace fallback. */
export const invalidateUserContext = async (platformUserId: string) => {
  await Promise.all([
    cache.del(key(platformUserId)),
    cache.del(graceKey(platformUserId))
  ]);
};

/** A role's permissions changed (via the platform's Role screen), unknown users affected —
 * drops every cached context, primary and grace alike. Roles change rarely; recomputing a
 * few costs far less than serving a stale permission. */
export const invalidateAllUserContexts = async () => {
  await Promise.all([
    cache.delPrefix(CACHE_PREFIX),
    cache.delPrefix(GRACE_CACHE_PREFIX)
  ]);
};
