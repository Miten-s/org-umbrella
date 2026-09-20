import { authSequelize } from "../configs/db.sequelize";
import { QueryTypes } from "sequelize";
import {
  fetchPermissionsForUser,
  fetchPermissionsForRoleIds,
  PermissionsFetchResult
} from "./backend-permissions.client";

// Helper to convert ObjectId to deterministic UUID
const toUUID = (id: string): string => {
  if (!id) return id;
  const str = id.toString().trim();
  if (str.length !== 24) return str;
  const p1 = str.substring(0, 8);
  const p2 = str.substring(8, 12);
  const p3 = str.substring(12, 16);
  const p4 = str.substring(16, 20);
  const p5 = str.substring(20, 24);
  return `${p1}-${p2}-${p3}-${p4}-${p5}00000000`;
};

export const fetchUserBasedOnId = async (userIds: string[]) => {
  if (!userIds || userIds.length === 0) return [];
  const uuids = userIds.map(toUUID);

  try {
    const users = await authSequelize.query(
      `SELECT id, name, email FROM users WHERE id IN (:uuids) AND deleted_at IS NULL`,
      {
        replacements: { uuids },
        type: QueryTypes.SELECT
      }
    );

    return users.map((u: any) => ({
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email
    }));
  } catch (error) {
    throw new Error("Failed to fetch users: " + error);
  }
};

export const fetchLocationsFromAuthService = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  const uuids = ids.map(toUUID);

  try {
    const locations = await authSequelize.query(
      `SELECT id, location_name, status FROM locations WHERE id IN (:uuids) AND deleted_at IS NULL`,
      {
        replacements: { uuids },
        type: QueryTypes.SELECT
      }
    );

    return locations.map((l: any) => ({
      _id: l.id,
      id: l.id,
      locationName: l.location_name,
      status: l.status
    }));
  } catch (error) {
    throw new Error("Failed to fetch groups: " + error);
  }
};

export const fetchDepartmentsFromAuthService = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  const uuids = ids.map(toUUID);

  try {
    const departments = await authSequelize.query(
      `SELECT id, department_name, status FROM departments WHERE id IN (:uuids) AND deleted_at IS NULL`,
      {
        replacements: { uuids },
        type: QueryTypes.SELECT
      }
    );

    return departments.map((d: any) => ({
      _id: d.id,
      id: d.id,
      departmentName: d.department_name,
      status: d.status
    }));
  } catch (error) {
    throw new Error("Failed to fetch groups: " + error);
  }
};

/** Permission NAMES (e.g. "GXP:VIEW:APPLICATION") granted by a set of platform role ids —
 * what the new authorize middleware actually needs to check against. Separate from
 * `fetchRolesFromAuthService` below, which returns permission ids for display purposes.
 * Resolved via backend's internal permissions API. Returns the raw `{ ok, permissions }`
 * result rather than collapsing a failure to `[]` — callers here need to tell "confirmed
 * empty" apart from "couldn't determine," since they fail closed differently: the role-
 * escalation guard must BLOCK on `ok: false` (an unverifiable role must not be treated as
 * granting nothing), while user-context.service.ts falls back to a cached grace value. */
export const fetchPermissionNamesForRoleIds = (
  roleIds: string[]
): Promise<PermissionsFetchResult> => fetchPermissionsForRoleIds(roleIds ?? []);

/** Is this platform user Super Admin (holds OPERATE:ALL)? Super Admin has full access to
 * every service without needing a GxpUser row (ROLES_AND_ACCESS_MANAGEMENT.md). Collapses
 * to `false` on failure — a safe default for this simple flag; an outage just means a real
 * Super Admin temporarily isn't treated as one, never the reverse. */
export const isPlatformSuperAdmin = async (
  platformUserId: string
): Promise<boolean> => {
  const result = await fetchPermissionsForUser(platformUserId);
  return result.ok && result.permissions.includes("OPERATE:ALL");
};

export const fetchRolesFromAuthService = async (
  ids: string[],
  project?: any
) => {
  if (!ids || ids.length === 0) return [];
  const uuids = ids.map(toUUID);

  try {
    // Query roles and their permission IDs
    const rows = await authSequelize.query(
      `SELECT r.id, r.name, r.type, rp.permission_id 
       FROM roles r 
       LEFT JOIN role_permissions rp ON r.id = rp.role_id 
       WHERE r.id IN (:uuids) AND r.deleted_at IS NULL`,
      {
        replacements: { uuids },
        type: QueryTypes.SELECT
      }
    );

    // Group rows by role id to build role objects with permissions array
    const rolesMap: { [key: string]: any } = {};
    for (const row of rows as any[]) {
      if (!rolesMap[row.id]) {
        rolesMap[row.id] = {
          _id: row.id,
          id: row.id,
          name: row.name,
          type: row.type,
          permissions: []
        };
      }
      if (row.permission_id) {
        rolesMap[row.id].permissions.push(row.permission_id);
      }
    }

    return Object.values(rolesMap);
  } catch (error) {
    throw new Error("Failed to fetch roles: " + error);
  }
};
