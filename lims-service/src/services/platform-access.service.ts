import { fetchPermissionsForUser } from "./backend-permissions.client";

export type SuperAdminStatus = "yes" | "no" | "unknown";

/** Is this platform user Super Admin (holds OPERATE:ALL)? Super Admin has full access to
 * every service without needing a lims_users row (ROLES_AND_ACCESS_MANAGEMENT.md).
 * Resolved via backend's internal permissions API; "unknown" when backend is unreachable,
 * so the caller can tell an outage apart from a plain "no". */
export const platformSuperAdminStatus = async (
  platformUserId: string
): Promise<SuperAdminStatus> => {
  const result = await fetchPermissionsForUser(platformUserId);
  if (!result.ok) return "unknown";
  return result.permissions.includes("OPERATE:ALL") ? "yes" : "no";
};
