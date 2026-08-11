import type { ServerListParams } from "@/lib/query/listTypes";

/**
 * GXP Permission query keys. Read-only module — no mutation hooks. The catalog is
 * seeded by the backend migration; it is never created, edited, or deleted here.
 */
export const permissionKeys = {
  all: ["gxpPermission"] as const,
  list: (params: ServerListParams) => ["gxpPermission", "list", params] as const
};
