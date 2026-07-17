import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Department, DepartmentPayload } from "./Department.types";

/**
 * Department API (STANDARDS.md §1/§2). Reads normalize ids (incl. nested
 * manager/location relations). `bulkClone*` calls the existing `/bulk-duplicate`.
 */
const ROUTE = "/departments";
const DATA_KEYS = ["departments"];
const RELATION_KEYS = ["departmentManager", "departmentGroupLocation"];

export const fetchDepartmentList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<Department>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for AsyncSelect consumers that select a department. */
export const fetchDepartmentOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Department>(response.data, params, (row) => row.departmentName, DATA_KEYS);
};

export const createDepartment = async (payload: DepartmentPayload) => {
  const response = await api.post(ROUTE, payload);
  return response.data;
};

export const updateDepartment = async (id: string, payload: DepartmentPayload) => {
  const response = await api.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteDepartment = async (id: string) => {
  const response = await api.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteDepartment = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneDepartment = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};
