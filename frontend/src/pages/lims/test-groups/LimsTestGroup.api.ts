import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsTestGroup, LimsTestGroupPayload } from "./LimsTestGroup.types";

/** LIMS Pick List API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-test-groups";
const DATA_KEYS = ["testGroups", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsTestGroupList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsTestGroup>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for other modules selecting this entity. */
export const fetchLimsTestGroupOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsTestGroup>(response.data, params, (row) => row.name, DATA_KEYS);
};

export const createLimsTestGroup = async (payload: LimsTestGroupPayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsTestGroup = async (id: string, payload: LimsTestGroupPayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsTestGroup = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsTestGroup = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const restoreLimsTestGroup = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsTestGroupAudit = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { signal });
  return response.data;
};
