/**
 * GXP Permission types. Lives on the admin `/permissions` endpoint, type = GXP_SERVICE.
 * Read-only catalog — there is no create/update payload; permissions are seeded by
 * the backend migration, not authored from the UI.
 */
export interface GxpPermission {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  permissionName: string;
  description?: string;
}
