import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsStudy, LimsStudyPayload } from "./LimsStudy.types";

/** LIMS Study API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-studies";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsStudyById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsStudy;
};
const DATA_KEYS = ["studies", "data"];
const RELATION_KEYS = ["group", "project", "supervisor"];

export const fetchLimsStudyList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsStudy>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for Stock, Stock Batches and Instruments. */
export const fetchLimsStudyOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsStudy>(
    response.data,
    params,
    (row) => row.name,
    DATA_KEYS
  );
};

const toBody = (payload: LimsStudyPayload, files?: File[]) => {
  if (!files?.length) return { body: payload as unknown, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData as unknown,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsStudy = async (payload: LimsStudyPayload, files?: File[]) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsStudy = async (
  id: string,
  payload: LimsStudyPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

export const bulkDeleteLimsStudy = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsStudy = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsStudy = async (records: LimsStudyPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsStudy = async (
  updates: { id: string; payload: LimsStudyPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsStudy = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsStudyAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
