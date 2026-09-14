import cache from "../configs/cache";
import GxpUser from "../models/gxp-service-users.model";
import {
  fetchPermissionNamesForRoleIds,
  isPlatformSuperAdmin
} from "./inter-service-calls.service";

/** Resolves the JWT's platform user id into everything GXP's access layer needs — cached,
 * since it's a GxpUser lookup plus a cross-database role/permission join. Mirrors
 * lims-service/src/services/user-context.service.ts. */
export interface GxpUserContext {
  gxpUserId: string;
  platformUserId: string;
  userName: string | null;
  /** True for the platform's Super Admin (OPERATE:ALL) — full access without a GxpUser row. */
  isSuperAdmin: boolean;
  /** Granted permission codes, e.g. "GXP:CREATE:APPLICATION". Union across roles. */
  permissions: Set<string>;
}

const CACHE_PREFIX = "gxp-user-ctx:";
const key = (platformUserId: string) => `${CACHE_PREFIX}${platformUserId}`;

/** Bounds staleness of a Gxp_Service role's permissions, which change on the platform's
 * own Roles screen with no invalidation channel back here — membership changes made in
 * gxp-service itself still invalidate immediately via invalidateUserContext below. */
const PERMISSION_STALENESS_TTL_SECONDS = 5 * 60;

interface CachedContext extends Omit<GxpUserContext, "permissions"> {
  permissions: string[];
}

/** Returns null when the platform user has neither Super Admin nor a gxp_users row — a
 * valid platform token is not by itself GXP access (same rule as LIMS). */
export const getGxpUserContext = async (
  platformUserId: string
): Promise<GxpUserContext | null> => {
  const cached = await cache.get<CachedContext>(key(platformUserId));
  if (cached) return { ...cached, permissions: new Set(cached.permissions) };

  const [superAdmin, gxpUser] = await Promise.all([
    isPlatformSuperAdmin(platformUserId),
    GxpUser.findOne({
      where: { authUserId: platformUserId, status: "enabled" }
    })
  ]);

  if (!superAdmin && !gxpUser) return null;

  const permissions = new Set(
    gxpUser ? await fetchPermissionNamesForRoleIds(gxpUser.roles ?? []) : []
  );

  const context: GxpUserContext = {
    gxpUserId: gxpUser?.id ?? "",
    platformUserId,
    userName: gxpUser?.userName ?? null,
    isSuperAdmin: superAdmin,
    permissions
  };

  await cache.set<CachedContext>(
    key(platformUserId),
    { ...context, permissions: [...permissions] },
    PERMISSION_STALENESS_TTL_SECONDS
  );

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

/** One user's access changed (their gxp_users row or role assignment). */
export const invalidateUserContext = async (platformUserId: string) => {
  await cache.del(key(platformUserId));
};

/** A role's permissions changed (via the platform's Role screen), unknown users affected —
 * drops every cached context. Roles change rarely; recomputing a few costs far less than
 * serving a stale permission. */
export const invalidateAllUserContexts = async () => {
  await cache.delPrefix(CACHE_PREFIX);
};
