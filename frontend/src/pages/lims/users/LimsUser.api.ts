import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsUser, LimsUserPayload } from "./LimsUser.types";

/** LimsUser API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-users";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsUserById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsUser;
};
const DATA_KEYS = ["users", "data"];
const RELATION_KEYS = ["group", "location"];

export const fetchLimsUserList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsUser>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsUserOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsUser>(
    response.data,
    params,
    (row) => String(row.userName ?? ""),
    DATA_KEYS
  );
};

export const createLimsUser = async (payload: LimsUserPayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsUser = async (id: string, payload: LimsUserPayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsUser = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsUser = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsUser = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsUser = async (records: LimsUserPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    // `userId` is a person reference, not a name — a collision is rejected, not
    // auto-suffixed, so a record can come back with `error` instead of `id`.
    results: { id?: string; warning?: string; error?: string }[];
  };
};

export const bulkUpdateLimsUser = async (
  updates: { id: string; payload: LimsUserPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsUser = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsUserAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
