import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsBatch, LimsBatchPayload } from "./LimsBatch.types";

/** LimsBatch API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-batches";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsBatchById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsBatch;
};
const DATA_KEYS = ["batches", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsBatchList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsBatch>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsBatchOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsBatch>(
    response.data,
    params,
    (row) => String(row.batchName ?? ""),
    DATA_KEYS
  );
};

const toBody = (payload: LimsBatchPayload, files?: File[]) => {
  if (!files?.length) return { body: payload as unknown, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData as unknown,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsBatch = async (payload: LimsBatchPayload, files?: File[]) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsBatch = async (
  id: string,
  payload: LimsBatchPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

export const bulkDeleteLimsBatch = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsBatch = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsBatch = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsBatch = async (records: LimsBatchPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsBatch = async (
  updates: { id: string; payload: LimsBatchPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsBatch = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsBatchAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
