import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { AssignmentGroup, AssignmentGroupPayload } from "./AssignmentGroup.types";

/** Assignment Group API (GXP). enable/disable are keyed by groupName (not id). */
const ROUTE = "/gxp-assignment-groups";
const DATA_KEYS = ["assignmentGroups", "groups", "data"];

export const fetchAssignmentGroupList = async (
  includeInactive: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = { ...buildServerParams(params), ...(includeInactive ? { includeInactive: true } : {}) };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  return toListResult<AssignmentGroup>(response.data, params, DATA_KEYS);
};

/** Full record for the Edit/Copy/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById, reused generically). */
export const fetchAssignmentGroupById = async (id: string, signal?: AbortSignal) => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return response.data as AssignmentGroup;
};

export const fetchAssignmentGroupOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<AssignmentGroup>(response.data, params, (row) => row.groupName, DATA_KEYS);
};

export const createAssignmentGroup = async (payload: AssignmentGroupPayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateAssignmentGroup = async (id: string, payload: AssignmentGroupPayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteAssignmentGroup = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteAssignmentGroup = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneAssignmentGroup = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/** The Copy flow's one and only network call — every reviewed record is
 * sent together, once (mirrors bulkCreate in lims-service's crud-factory). */
export const bulkCopyAssignmentGroup = async (records: AssignmentGroupPayload[]) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as AssignmentGroup[];
};

export const bulkUpdateAssignmentGroup = async (updates: { id: string; payload: AssignmentGroupPayload }[]) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as { results: { id: string; status: "updated" | "skipped" }[] };
};

/** Bulk-restore is id-keyed (unlike the single enable/disable routes above,
 * which are groupName-keyed) — matches every other module's bulk-restore shape. */
export const bulkRestoreAssignmentGroup = async (selection: BulkSelection) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-restore`, bulkSelectionToBody(selection));
  return response.data as { message: string; count: number };
};

/** enable/disable are keyed by groupName — preserved exactly from the legacy service. */
export const enableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${groupName}`);
  return response.data;
};

export const disableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${groupName}`);
  return response.data;
};
