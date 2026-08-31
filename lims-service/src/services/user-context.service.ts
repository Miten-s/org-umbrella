import { QueryTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import cache from "../configs/cache";
import LimsUser from "../models/lims-user.model";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import Group from "../models/group.model";
import { ACTION_COLUMN, LimsAction } from "../utils/permissions";

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
const permissionsFromRoles = (
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

/** Returns null when the platform user has no lims_users row — a valid platform token is
 * not by itself LIMS access. */
export const getUserContext = async (platformUserId: string): Promise<UserContext | null> => {
  const cached = await cache.get<CachedContext>(key(platformUserId));
  if (cached) return { ...cached, permissions: new Set(cached.permissions) };

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
      { model: Group, as: "accessGroups", required: false, where: { isDeleted: false } }
    ]
  })) as (LimsUser & { roles?: Role[]; accessGroups?: Group[] }) | null;

  if (!limsUser) return null;

  const { permissions, operateAll } = permissionsFromRoles(
    (limsUser.roles ?? []) as (Role & { entries?: RoleEntry[] })[]
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

  await cache.set<CachedContext>(key(platformUserId), {
    ...context,
    permissions: [...permissions]
  });

  return context;
};

export const hasPermission = (context: UserContext, action: LimsAction, entity: string): boolean =>
  context.operateAll || context.permissions.has(`LIMS:${action}:${entity}`);

// ---------------------------------------------------------------------------
// Invalidation — called on write, never left to a TTL.
// ---------------------------------------------------------------------------

/** One user's access changed (their lims_users row, roles or access groups). */
export const invalidateUserContext = async (platformUserId: string) => {
  await cache.del(key(platformUserId));
};

/** A role/group changed, unknown users affected — drops every cached context; roles/groups
 * change rarely, and recomputing a few costs far less than serving a stale permission. */
export const invalidateAllUserContexts = async () => {
  await cache.delPrefix(CACHE_PREFIX);
};
