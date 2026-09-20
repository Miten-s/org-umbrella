import { fetchPermissionsForUser } from "./backend-permissions.client";

/** Is this platform user Super Admin (holds OPERATE:ALL)? Super Admin has full access to
 * every service without needing a lims_users row (ROLES_AND_ACCESS_MANAGEMENT.md).
 * Resolved via backend's internal permissions API — fails closed if backend is
 * unreachable, so an outage denies Super Admin rather than granting it. */
export const isPlatformSuperAdmin = async (
  platformUserId: string
): Promise<boolean> => {
  const result = await fetchPermissionsForUser(platformUserId);
  return result.ok && result.permissions.includes("OPERATE:ALL");
};
