import CircuitBreaker from "opossum";
import ENV from "../utils/environment";
import {
  fetchPermissionsForUser,
  fetchPermissionsForRoleIds,
  PermissionsFetchResult,
  PERMISSIONS_BREAKER_OPTIONS
} from "./backend-permissions.client";

/** Names and labels for ids GXP stores (users, locations, departments, roles) come from
 * backend's internal directory API — GXP never reads backend's database. */

const REQUEST_TIMEOUT_MS = 3000;

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

const requestDirectory = async (
  resource: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const response = await fetch(
    `${ENV.BACKEND_INTERNAL_URL}/internal/directory/${resource}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-api-key": ENV.INTERNAL_API_KEY as string
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  );
  if (!response.ok) {
    throw new Error(`backend directory API returned ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
};

const directoryBreaker = new CircuitBreaker(
  requestDirectory,
  PERMISSIONS_BREAKER_OPTIONS
);

const lookup = async <T>(resource: string, ids: string[]): Promise<T[]> => {
  if (!ids || ids.length === 0) return [];
  try {
    const body = await directoryBreaker.fire(resource, {
      ids: ids.map(toUUID)
    });
    return (body[resource] as T[]) ?? [];
  } catch (error) {
    throw new Error(`Failed to fetch ${resource}: ${String(error)}`);
  }
};

export const fetchUserBasedOnId = async (userIds: string[]) =>
  (
    await lookup<{ id: string; name: string; email: string }>("users", userIds)
  ).map((u) => ({ _id: u.id, ...u }));

export const fetchLocationsFromAuthService = async (ids: string[]) =>
  (
    await lookup<{ id: string; locationName: string; status: string }>(
      "locations",
      ids
    )
  ).map((l) => ({ _id: l.id, ...l }));

export const fetchDepartmentsFromAuthService = async (ids: string[]) =>
  (
    await lookup<{ id: string; departmentName: string; status: string }>(
      "departments",
      ids
    )
  ).map((d) => ({ _id: d.id, ...d }));

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

export const fetchRolesFromAuthService = async (ids: string[]) =>
  (
    await lookup<{
      id: string;
      name: string;
      type: string;
      permissionIds: string[];
    }>("roles", ids)
  ).map((r) => ({
    _id: r.id,
    id: r.id,
    name: r.name,
    type: r.type,
    permissions: r.permissionIds
  }));
