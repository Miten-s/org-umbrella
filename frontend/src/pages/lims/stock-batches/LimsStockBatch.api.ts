import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsStockBatch, LimsStockBatchPayload } from "./LimsStockBatch.types";

/** LimsStockBatch API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-stock-batches";
const DATA_KEYS = ["stockBatches", "data"];
const RELATION_KEYS = ["stock", "status", "project", "supplier", "location"];

export const fetchLimsStockBatchList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsStockBatch>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsStockBatchOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsStockBatch>(
    response.data,
    params,
    (row) => String(row.stockBatchId ?? ""),
    DATA_KEYS
  );
};

const toBody = (payload: LimsStockBatchPayload, files?: File[]) => {
  if (!files?.length) return { body: payload as unknown, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData as unknown,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsStockBatch = async (payload: LimsStockBatchPayload, files?: File[]) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsStockBatch = async (
  id: string,
  payload: LimsStockBatchPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

export const bulkDeleteLimsStockBatch = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsStockBatch = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const restoreLimsStockBatch = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsStockBatchAudit = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { signal });
  return response.data;
};
