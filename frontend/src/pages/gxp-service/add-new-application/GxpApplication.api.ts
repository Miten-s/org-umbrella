import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult } from "@/lib/query/listAdapter";
import { normalizeId } from "@/lib/query/normalizeId";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { GxpApplication, GxpApplicationPayload } from "./GxpApplication.types";

/** GXP Application API (GXP). `.api` is pure HTTP — toasts in the mutation layer. */
const ROUTE = "/gxp-applications";
const DATA_KEYS = ["applications", "data"];

const buildApplicationFormData = (payload: GxpApplicationPayload, files?: File[]) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  (files || []).forEach((file) => formData.append("attachments", file));
  return formData;
};

export const fetchApplicationList = async (
  includeDisabled: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = { ...buildServerParams(params), ...(includeDisabled ? { includeDisabled: true } : {}) };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  return toListResult<GxpApplication>(response.data, params, DATA_KEYS);
};

/** Full record with populated relation refs (used to seed the form on edit). */
export const fetchApplicationById = async (id: string, signal?: AbortSignal): Promise<GxpApplication> => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return normalizeId(response.data?.application ?? response.data?.data ?? response.data);
};

export const createApplication = async (payload: GxpApplicationPayload, files?: File[]) => {
  const response = await gxpApi.post(ROUTE, buildApplicationFormData(payload, files), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const updateApplication = async (id: string, payload: GxpApplicationPayload, files?: File[]) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, buildApplicationFormData(payload, files), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const bulkDeleteApplication = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneApplication = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const enableApplication = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableApplication = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
