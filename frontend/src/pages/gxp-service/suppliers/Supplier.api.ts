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

/** Full record for the Edit/Copy/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById, reused generically). */
export const fetchSupplierById = async (id: string, signal?: AbortSignal) => {
  const response = await gxpApi.get(`${ROUTE}/${id}`, { signal });
  return response.data as Supplier;
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

/** The Copy flow's one and only network call — every reviewed record is
 * sent together, once (mirrors bulkCreate in lims-service's crud-factory). */
export const bulkCopySupplier = async (records: SupplierPayload[]) => {
  const response = await gxpApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as Supplier[];
};

export const bulkUpdateSupplier = async (updates: { id: string; payload: SupplierPayload }[]) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as { results: { id: string; status: "updated" | "skipped" }[] };
};

export const bulkRestoreSupplier = async (selection: BulkSelection) => {
  const response = await gxpApi.patch(`${ROUTE}/bulk-restore`, bulkSelectionToBody(selection));
  return response.data as { message: string; count: number };
};

export const enableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/enable/${id}`);
  return response.data;
};

export const disableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${ROUTE}/disable/${id}`);
  return response.data;
};
