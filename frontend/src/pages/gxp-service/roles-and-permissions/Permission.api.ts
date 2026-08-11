import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult } from "@/lib/query/listAdapter";
import type { ServerListParams } from "@/lib/query/listTypes";
import { PermissionType } from "@/utils/common.constants";
import type { GxpPermission } from "./Permission.types";

/**
 * GXP Permission API — admin `/permissions` endpoint, scoped to GXP_SERVICE.
 * Read-only: the catalog is seeded by the backend (migration), not created or
 * edited from the UI — see backend/src/migrations/012-seed-initial-data.ts for
 * the seeding pattern.
 */
const ROUTE = "/permissions";

export const fetchPermissionList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await api.get(ROUTE, {
    params: buildServerParams({ ...params, type: PermissionType.GXP_SERVICE }),
    signal
  });
  const result = toListResult<GxpPermission>(response.data, params, ["permissions", "data"]);
  // Normalize the display field exactly as the pre-migration mapItems did.
  result.rows = result.rows.map((p) => ({
    ...p,
    permissionName: p.permissionName ?? (p as unknown as { name?: string }).name ?? ""
  }));
  return result;
};
