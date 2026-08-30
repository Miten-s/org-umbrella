import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsInspectionPlan, LimsInspectionPlanPayload } from "./LimsInspectionPlan.types";

/** LimsInspectionPlan API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-inspection-plans";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsInspectionPlanById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsInspectionPlan;
};
const DATA_KEYS = ["inspectionPlans", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsInspectionPlanList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsInspectionPlan>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsInspectionPlanOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsInspectionPlan>(
    response.data,
    params,
    (row) => String(row.name ?? ""),
    DATA_KEYS
  );
};

export const createLimsInspectionPlan = async (payload: LimsInspectionPlanPayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsInspectionPlan = async (id: string, payload: LimsInspectionPlanPayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsInspectionPlan = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsInspectionPlan = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsInspectionPlan = async (records: LimsInspectionPlanPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsInspectionPlan = async (
  updates: { id: string; payload: LimsInspectionPlanPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsInspectionPlan = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsInspectionPlanAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
