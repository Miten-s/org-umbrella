import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import { PermissionType } from "@/utils/common.constants";
import type { GxpPermission, GxpPermissionPayload } from "./Permission.types";

/** GXP Permission API — admin `/permissions` endpoint, scoped to GXP_SERVICE. */
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

export const createPermission = async (payload: GxpPermissionPayload) => {
  const response = await api.post(ROUTE, payload);
  return response.data;
};

export const updatePermission = async (id: string, payload: GxpPermissionPayload) => {
  const response = await api.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeletePermission = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};
