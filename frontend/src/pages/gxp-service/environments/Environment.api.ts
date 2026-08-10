import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Environment, EnvironmentPayload } from "./Environment.types";

/** Environment API (GXP). `.api` is pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/gxp-environments";
const DATA_KEYS = ["environments", "data"];

export const fetchEnvironmentList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<Environment>(response.data, params, DATA_KEYS);
};

export const fetchEnvironmentOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Environment>(response.data, params, (row) => row.environmentName, DATA_KEYS);
};

export const createEnvironment = async (payload: EnvironmentPayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateEnvironment = async (id: string, payload: EnvironmentPayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteEnvironment = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteEnvironment = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneEnvironment = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};
