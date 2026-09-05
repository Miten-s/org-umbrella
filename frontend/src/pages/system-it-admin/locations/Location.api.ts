import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { normalizeId } from "@/lib/query/normalizeId";
import { bulkSelectionToBody, type AsyncOption, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { Location, LocationPayload } from "./Location.types";

/** Location API (STANDARDS.md §1/§2). `bulkClone*` → existing `/bulk-duplicate`. */
const ROUTE = "/locations";
const DATA_KEYS = ["locations"];

export const fetchLocationList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<Location>(response.data, params, DATA_KEYS);
};

/** Options for AsyncSelect consumers that select a location. */
export const fetchLocationOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<Location>(response.data, params, (row) => row.locationName, DATA_KEYS);
};

/** Resolve selected location labels by id (for AsyncSelect edit-seed when the
 *  parent record carries only the id, e.g. Add New Application's `group`). */
export const resolveLocationByIds = async (ids: string[], signal?: AbortSignal): Promise<AsyncOption[]> => {
  const results = await Promise.all(
    ids.map((id) =>
      api
        .get(`${ROUTE}/${id}`, { signal })
        .then((r) => normalizeId(r.data?.location ?? r.data?.data ?? r.data))
        .catch(() => null)
    )
  );
  return results
    .filter((l): l is Location => Boolean(l?.id))
    .map((l) => ({ value: l.id, label: l.locationName }));
};

export const createLocation = async (payload: LocationPayload) => {
  const response = await api.post(ROUTE, payload);
  return response.data;
};

export const updateLocation = async (id: string, payload: LocationPayload) => {
  const response = await api.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const deleteLocation = async (id: string) => {
  const response = await api.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteLocation = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

export const bulkCloneLocation = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

/** Full-detail fetch for the Copy/Edit/View review steppers — distinct from
 *  `resolveLocationByIds`, which seeds AsyncSelect labels in a different shape. */
export const fetchLocationById = async (id: string, signal?: AbortSignal) => {
  const response = await api.get(`${ROUTE}/${id}`, { signal });
  return normalizeId(response.data?.location ?? response.data?.data ?? response.data) as Location;
};

/** The Copy flow's batched save — one request creates every reviewed record. */
export const bulkCopyLocation = async (records: LocationPayload[]) => {
  const response = await api.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

/** Bulk Edit's batched save — only the records actually reviewed and changed. */
export const bulkUpdateLocation = async (updates: { id: string; payload: LocationPayload }[]) => {
  const response = await api.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};
