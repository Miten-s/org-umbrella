import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { normalizeList } from "@/lib/query/normalizeId";
import { extractList } from "@/utils/listResponse";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsPermissionOption, LimsRole, LimsRolePayload } from "./LimsRole.types";

/** LIMS Role API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-roles";
const PERMISSIONS_ROUTE = "/lims-permissions";
const DATA_KEYS = ["roles", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsRoleList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsRole>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsRoleOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsRole>(response.data, params, (row) => row.name, DATA_KEYS);
};

export const createLimsRole = async (payload: LimsRolePayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsRole = async (id: string, payload: LimsRolePayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsRole = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsRole = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const restoreLimsRole = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsRoleAudit = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { signal });
  return response.data;
};

/**
 * All LIMS permissions (id + name) for the role form's permission picker. This is a
 * read-only catalog seeded by the backend — there is no create/update/delete here.
 */
export const fetchLimsRolePermissions = async (
  signal?: AbortSignal
): Promise<LimsPermissionOption[]> => {
  const response = await limsApi.get(PERMISSIONS_ROUTE, { params: { limit: 200 }, signal });
  // The catalog row has no `name` — `code` (e.g. "LIMS:CREATE:ALIQUOT") is both
  // the human-facing picker value and what PermissionPicker.groupPermissions
  // parses via split(":"). `label` is display-only text, not usable here.
  return normalizeList<{ id?: string; _id?: string; code: string }>(
    extractList(response.data, ["permissions"])
  ).map((p) => ({ id: p.id, name: p.code }));
};
