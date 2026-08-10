import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Supplier, SupplierPayload } from "./Supplier.types";

/**
 * Supplier API (STANDARDS.md §1/§2). GXP entity → uses the `gxpApi` axios
 * instance (different base URL). `includeDisabled` is a bespoke supported filter
 * (backend param) surfaced as a toolbar toggle in the List.
 */
const ROUTE = "/gxp-suppliers";
const DATA_KEYS = ["suppliers"];

export const fetchSupplierList = async (
  includeDisabled: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const query = {
    ...buildServerParams(params),
    ...(includeDisabled ? { includeDisabled: true } : {})
  };
  const response = await gxpApi.get(ROUTE, { params: query, signal });
  return toListResult<Supplier>(response.data, params, DATA_KEYS);
};

export const fetchSupplierOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Supplier>(response.data, params, (row) => row.supplierName, DATA_KEYS);
};

export const createSupplier = async (payload: SupplierPayload) => {
  const response = await gxpApi.post(ROUTE, payload);
  return response.data;
};

export const updateSupplier = async (id: string, payload: SupplierPayload) => {
  const response = await gxpApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteSupplier = async (id: string) => {
  const response = await gxpApi.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteSupplier = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneSupplier = async (selection: BulkSelection) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const enableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
