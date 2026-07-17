import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Workflow, WorkflowPayload } from "./Workflow.types";

/** Workflow API (GXP). `.api` is pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/gxp-workflows";
const DATA_KEYS = ["workflows", "data"];

export const fetchWorkflowList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<Workflow>(response.data, params, DATA_KEYS);
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

export const enableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
