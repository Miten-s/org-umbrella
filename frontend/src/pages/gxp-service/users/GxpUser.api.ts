import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { GxpUser, GxpUserPayload, GxpUserRole } from "./GxpUser.types";

/** GXP Service User API (GXP). `.api` is pure HTTP — toasts in the mutation layer. */
const ROUTE = "/gxp-users";
const DATA_KEYS = ["gxpUsers", "users", "items", "data"];

/** Normalize roles to { id, name } (raw may be ids or populated objects). */
const normalizeRoles = (roles: unknown): GxpUserRole[] => {
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return list
    .map((r: any) =>
      typeof r === "string"
        ? { id: r, name: r }
        : { id: String(r?._id ?? r?.id ?? ""), name: String(r?.name ?? r?._id ?? r?.id ?? "") }
    )
    .filter((r) => r.id);
};

export const fetchGxpUserList = async (
  includeDisabled: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = { ...buildServerParams(params), ...(includeDisabled ? { includeDisabled: true } : {}) };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  const result = toListResult<GxpUser>(response.data, params, DATA_KEYS);
  result.rows = result.rows.map((u: any) => ({
    ...u,
    user: { id: u.user?.id ?? "", name: u.user?.name ?? "" },
    userType: u.userType ?? "User",
    roles: normalizeRoles(u.roles),
    status: u.status ?? "enabled"
  }));
  return result;
};

/** Full record for the Edit/Copy/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById, reused generically). */
export const fetchGxpUserById = async (id: string, signal?: AbortSignal): Promise<GxpUser> => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  const u: any = response.data;
  return {
    ...u,
    id: u.id ?? u._id,
    user: { id: u.user?.id ?? "", name: u.user?.name ?? "" },
    userType: u.userType ?? "User",
    roles: normalizeRoles(u.roles),
    status: u.status ?? "enabled"
  };
};

/** Every platform userId already mapped to a GXP user, active OR disabled — included on
 * purpose, since the backend has no uniqueness check scoped to active rows either. */
export const fetchLinkedPlatformUserIds = async (signal?: AbortSignal): Promise<Set<string>> => {
  const response = await gxpApi.get(ROUTE, {
    params: { ...buildServerParams({ page: 1, limit: 500 }), includeDisabled: true },
    signal
  });
  const result = toListResult<GxpUser>(response.data, { page: 1, limit: 500 }, DATA_KEYS);
  return new Set(
    result.rows.map((row: any) => row.user?.id).filter((id: unknown): id is string => Boolean(id))
  );
};

export const createGxpUser = async (payload: GxpUserPayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateGxpUser = async (id: string, payload: GxpUserPayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteGxpUser = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteGxpUser = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

/** The Copy flow's one and only network call — every reviewed record is
 * sent together, once (mirrors bulkCreate in lims-service's crud-factory). */
export const bulkCopyGxpUser = async (records: GxpUserPayload[]) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as GxpUser[];
};

export const bulkUpdateGxpUser = async (updates: { id: string; payload: GxpUserPayload }[]) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as { results: { id: string; status: "updated" | "skipped" }[] };
};

export const bulkRestoreGxpUser = async (selection: BulkSelection) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-restore`, bulkSelectionToBody(selection));
  return response.data as { message: string; count: number };
};

export const enableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
