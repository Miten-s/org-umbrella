import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsAnalysis, LimsAnalysisPayload } from "./LimsAnalysis.types";

/** LimsAnalysis API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-analyses";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsAnalysisById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsAnalysis;
};
const DATA_KEYS = ["analyses", "data"];
const RELATION_KEYS = ["group", "analysisType", "inspectionPlan", "approvalStatus"];

export const fetchLimsAnalysisList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsAnalysis>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsAnalysisOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsAnalysis>(
    response.data,
    params,
    (row) => String(row.name ?? ""),
    DATA_KEYS
  );
};

export const createLimsAnalysis = async (payload: LimsAnalysisPayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsAnalysis = async (id: string, payload: LimsAnalysisPayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsAnalysis = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsAnalysis = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/** The Copy flow's one and only network call: every reviewed record (CopyStepper) sent
 * together, once, to be created in one transaction (see `bulkCreate` in crud-factory.ts). */
export const bulkCopyLimsAnalysis = async (records: LimsAnalysisPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

/** Bulk Edit's one and only network call: just the records EditStepper kept as actually
 * changed, paired with their id, plus the shared reason, updated in one transaction. */
export const bulkUpdateLimsAnalysis = async (
  updates: { id: string; payload: LimsAnalysisPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsAnalysis = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsAnalysisAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
