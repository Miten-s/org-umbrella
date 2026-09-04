import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { normalizeList } from "@/lib/query/normalizeId";
import { extractList } from "@/utils/listResponse";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type {
  LimsPermissionOption,
  LimsRole,
  LimsRolePayload
} from "./LimsRole.types";

/** LIMS Role API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-roles";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsRoleById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsRole;
};
const PERMISSIONS_ROUTE = "/lims-permissions";
const DATA_KEYS = ["roles", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsRoleList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: {
      ...buildServerParams(params),
      includeRemoved: includeRemoved || undefined
    },
    signal
  });
  return toListResult<LimsRole>(
    response.data,
    params,
    DATA_KEYS,
    RELATION_KEYS
  );
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
  const response = await limsApi.get(ROUTE, {
    params: buildServerParams(params),
    signal
  });
  return toOptionsPage<LimsRole>(
    response.data,
    params,
    (row) => row.name,
    DATA_KEYS
  );
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

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsRole = async (records: LimsRolePayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkCloneLimsRole = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

export const bulkUpdateLimsRole = async (
  updates: { id: string; payload: LimsRolePayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsRole = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, {
    changeReason
  });
  return response.data;
};

export const fetchLimsRoleAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, {
    params,
    signal
  });
  return response.data;
};

/**
 * All LIMS permissions (id + name) for the role form's permission picker. This is a
 * read-only catalog seeded by the backend — there is no create/update/delete here.
 */
export const fetchLimsRolePermissions = async (
  signal?: AbortSignal
): Promise<LimsPermissionOption[]> => {
  const response = await limsApi.get(PERMISSIONS_ROUTE, {
    params: { limit: 200 },
    signal
  });
  // `code` (e.g. "LIMS:CREATE:ALIQUOT"), not `label`, is what groupPermissions parses via split(":").
  return normalizeList<{ id?: string; _id?: string; code: string }>(
    extractList(response.data, ["permissions"])
  ).map((p) => ({ id: p.id, name: p.code }));
};
