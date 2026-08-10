import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult } from "@/lib/query/listAdapter";
import { normalizeId } from "@/lib/query/normalizeId";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { GxpServiceRequest, GxpServiceRequestPayload } from "./GxpServiceRequest.types";

/** GXP Service Request API (GXP). `.api` is pure HTTP — toasts in the mutation layer. */
const ROUTE = "/gxp-service-requests";
const DATA_KEYS = ["serviceRequests", "data"];

const buildFormData = (payload: GxpServiceRequestPayload, files?: File[]) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  (files || []).forEach((file) => formData.append("attachments", file));
  return formData;
};

export const fetchServiceRequestList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<GxpServiceRequest>(response.data, params, DATA_KEYS);
};

export const fetchServiceRequestById = async (id: string, signal?: AbortSignal): Promise<GxpServiceRequest> => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return normalizeId(response.data?.serviceRequest ?? response.data?.data ?? response.data);
};

export const createServiceRequest = async (payload: GxpServiceRequestPayload, files?: File[]) => {
  const response = await gxpApi.post(ROUTE, buildFormData(payload, files), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const updateServiceRequest = async (id: string, payload: GxpServiceRequestPayload, files?: File[]) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, buildFormData(payload, files), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const bulkDeleteServiceRequest = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};
