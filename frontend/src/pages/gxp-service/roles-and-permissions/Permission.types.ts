/** GXP Permission types. Lives on the admin `/permissions` endpoint, type = GXP_SERVICE. */
export interface GxpPermission {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  permissionName: string;
  description?: string;
}

export interface GxpPermissionPayload {
  name: string;
  description?: string;
  type: string;
}
