/** GXP Service User types (STANDARDS.md §1). GXP entity — served via gxpApi. */
export interface GxpUserRole {
  id: string;
  name: string;
}

export interface GxpUser {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  /** the referenced platform user */
  user: { id: string; name: string };
  userType: "User" | "Resolver";
  /** normalized to { id, name } so labels resolve without a load-all */
  roles: GxpUserRole[];
  description?: string;
  status: "enabled" | "disabled";
}

export interface GxpUserPayload {
  user: { id: string; name: string };
  userType: "User" | "Resolver";
  /** role ids */
  roles: string[];
  description?: string;
  status: "enabled" | "disabled";
}
