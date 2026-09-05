import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsGroup, LimsGroupPayload } from "./LimsGroup.types";

/** LIMS Lab Group API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-groups";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsGroupById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsGroup;
};
const DATA_KEYS = ["groups", "data"];
const RELATION_KEYS = ["ownedBy", "parentGroup"];

export const fetchLimsGroupList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsGroup>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other LIMS modules selecting a Lab Group. */
export const fetchLimsGroupOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsGroup>(response.data, params, (row) => row.name, DATA_KEYS);
};

export const createLimsGroup = async (payload: LimsGroupPayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsGroup = async (id: string, payload: LimsGroupPayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsGroup = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsGroup = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsGroup = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsGroup = async (records: LimsGroupPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsGroup = async (
  updates: { id: string; payload: LimsGroupPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsGroup = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsGroupAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
