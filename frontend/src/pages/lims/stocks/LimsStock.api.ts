import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsStock, LimsStockPayload } from "./LimsStock.types";

/** LimsStock API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-stocks";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsStockById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsStock;
};
const DATA_KEYS = ["stocks", "data"];
const RELATION_KEYS = [
  "group",
  "stockType",
  "operator",
  "defaultLocation",
  "preferredSupplier"
];

export const fetchLimsStockList = async (
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
  return toListResult<LimsStock>(
    response.data,
    params,
    DATA_KEYS,
    RELATION_KEYS
  );
};

/** Options for other modules selecting this entity. */
export const fetchLimsStockOptions = async (
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
  return toOptionsPage<LimsStock>(
    response.data,
    params,
    (row) => String(row.stockName ?? ""),
    DATA_KEYS
  );
};

const toBody = (payload: LimsStockPayload, files?: File[]) => {
  if (!files?.length) return { body: payload as unknown, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData as unknown,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsStock = async (
  payload: LimsStockPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsStock = async (
  id: string,
  payload: LimsStockPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

export const bulkDeleteLimsStock = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsStock = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsStock = async (records: LimsStockPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkCloneLimsStock = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

export const bulkUpdateLimsStock = async (
  updates: { id: string; payload: LimsStockPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsStock = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, {
    changeReason
  });
  return response.data;
};

export const fetchLimsStockAudit = async (
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
