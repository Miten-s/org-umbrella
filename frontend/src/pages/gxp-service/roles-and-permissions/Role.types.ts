/** GXP Role types (STANDARDS.md §1). Roles are served by gxp-service's `/gxp-roles`
 *  and stored in backend. */
export type RolePermissionRef =
  { id?: string; _id?: string; name?: string } | string;

export interface GxpRole {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  name: string;
  permissions?: RolePermissionRef[];
}

export interface GxpRolePayload {
  name: string;
  /** permission ids */
  permissions: string[];
}

/** A GXP permission option {id, name} used to map role permission names → ids. */
export interface GxpPermissionOption {
  id: string;
  _id: string;
  name: string;
}

export const getRolePermissionNames = (role: GxpRole): string[] =>
  (role.permissions ?? [])
    .map((permission) =>
      typeof permission === "string" ? permission : (permission?.name ?? "")
    )
    .filter(Boolean);
