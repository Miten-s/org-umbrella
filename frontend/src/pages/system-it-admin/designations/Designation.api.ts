import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Designation, DesignationPayload } from "./Designation.types";

/**
 * Designation API — the ONLY place designation endpoints live (STANDARDS.md §1/§2).
 * Wraps the shared axios instance; every read normalizes ids via the adapter.
 * `bulkClone*` calls the existing `/bulk-duplicate` route (no backend rename).
 */
const ROUTE = "/designations";
const DATA_KEYS = ["designations"];

export const fetchDesignationList = async (
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await api.get(ROUTE, {
    params: buildServerParams(params),
    signal
  });
  return toListResult<Designation>(response.data, params, DATA_KEYS);
};

export const fetchDesignationById = async (id: string, signal?: AbortSignal) => {
  const response = await api.get(`${ROUTE}/${id}`, { signal });
  return response.data;
};

export const fetchDesignationOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Designation>(
    response.data,
    params,
    (row) => row.designationName,
    DATA_KEYS
  );
};

export const createDesignation = async (payload: DesignationPayload) => {
  const response = await api.post(ROUTE, payload);
  return response.data;
};

export const updateDesignation = async (id: string, payload: DesignationPayload) => {
  const response = await api.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteDesignation = async (id: string) => {
  const response = await api.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteDesignation = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneDesignation = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};
