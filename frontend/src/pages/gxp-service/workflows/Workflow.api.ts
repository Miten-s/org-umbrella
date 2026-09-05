import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Workflow, WorkflowPayload } from "./Workflow.types";

/** Workflow API (GXP). `.api` is pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/gxp-workflows";
const DATA_KEYS = ["workflows", "data"];

export const fetchWorkflowList = async (
  includeDisabled: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = { ...buildServerParams(params), ...(includeDisabled ? { includeDisabled: true } : {}) };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  return toListResult<Workflow>(response.data, params, DATA_KEYS);
};

/** Full record for the Edit/Copy/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById, reused generically). */
export const fetchWorkflowById = async (id: string, signal?: AbortSignal) => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return response.data as Workflow;
};

export const fetchWorkflowOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Workflow>(response.data, params, (row) => row.workflowName, DATA_KEYS);
};

export const createWorkflow = async (payload: WorkflowPayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateWorkflow = async (id: string, payload: WorkflowPayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteWorkflow = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteWorkflow = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneWorkflow = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/** The Copy flow's one and only network call — every reviewed record is
 * sent together, once (mirrors bulkCreate in lims-service's crud-factory). */
export const bulkCopyWorkflow = async (records: WorkflowPayload[]) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as Workflow[];
};

export const bulkUpdateWorkflow = async (updates: { id: string; payload: WorkflowPayload }[]) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as { results: { id: string; status: "updated" | "skipped" }[] };
};

export const bulkRestoreWorkflow = async (selection: BulkSelection) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-restore`, bulkSelectionToBody(selection));
  return response.data as { message: string; count: number };
};

export const enableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
