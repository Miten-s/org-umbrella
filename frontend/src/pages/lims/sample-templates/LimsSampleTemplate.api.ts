import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type {
  LimsSampleTemplate,
  LimsSampleTemplatePayload
} from "./LimsSampleTemplate.types";

/** LIMS Test Group API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-sample-templates";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsSampleTemplateById = async (
  id: string,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsSampleTemplate;
};
const DATA_KEYS = ["sampleTemplates", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsSampleTemplateList = async (
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
  return toListResult<LimsSampleTemplate>(
    response.data,
    params,
    DATA_KEYS,
    RELATION_KEYS
  );
};

/** Options for other modules selecting this entity. */
export const fetchLimsSampleTemplateOptions = async (
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
  return toOptionsPage<LimsSampleTemplate>(
    response.data,
    params,
    (row) => row.name,
    DATA_KEYS
  );
};

export const createLimsSampleTemplate = async (
  payload: LimsSampleTemplatePayload
) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsSampleTemplate = async (
  id: string,
  payload: LimsSampleTemplatePayload
) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsSampleTemplate = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsSampleTemplate = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsSampleTemplate = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsSampleTemplate = async (
  records: LimsSampleTemplatePayload[]
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsSampleTemplate = async (
  updates: { id: string; payload: LimsSampleTemplatePayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, {
    updates,
    changeReason
  });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsSampleTemplate = async (
  id: string,
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, {
    changeReason
  });
  return response.data;
};

export const fetchLimsSampleTemplateAudit = async (
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
