import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { ApplicationSoftwareModule, ModulePayload } from "./Module.types";

/** App/Software Module API (GXP). `.api` is pure HTTP — toasts in the mutation layer. */
const ROUTE = "/gxp-application-modules";
const DATA_KEYS = ["modules", "software", "data"];
const RELATION_KEYS = ["application"];

export const fetchModuleList = async (
  includeDisabled: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = { ...buildServerParams(params), ...(includeDisabled ? { includeDisabled: true } : {}) };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  return toListResult<ApplicationSoftwareModule>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Full record for the Edit/Copy/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById, reused generically). */
export const fetchModuleById = async (id: string, signal?: AbortSignal) => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return response.data as ApplicationSoftwareModule;
};

export const fetchModuleOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<ApplicationSoftwareModule>(response.data, params, (row) => row.moduleName, DATA_KEYS);
};

export const createModule = async (payload: ModulePayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateModule = async (id: string, payload: ModulePayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteModule = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteModule = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneModule = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/**
 * A2: this module has no /enable|/disable route — drive the status toggle
 * through the update endpoint (PATCH /:id with just { status }).
 */
export const setModuleStatus = async (id: string, status: "enabled" | "disabled") => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, { status });
  return response.data;
};

/** The Copy flow's one and only network call — every reviewed record is
 * sent together, once (mirrors bulkCreate in lims-service's crud-factory). */
export const bulkCopyModule = async (records: ModulePayload[]) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as ApplicationSoftwareModule[];
};

export const bulkUpdateModule = async (updates: { id: string; payload: ModulePayload }[]) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as { results: { id: string; status: "updated" | "skipped" }[] };
};

/** Bulk-restore reuses the generic status-update path (see setModuleStatus —
 * this module has no dedicated /enable route either). */
export const bulkRestoreModule = async (selection: BulkSelection) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-restore`, bulkSelectionToBody(selection));
  return response.data as { message: string; count: number };
};
