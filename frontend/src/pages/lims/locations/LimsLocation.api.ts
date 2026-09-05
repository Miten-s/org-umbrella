import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsLocation, LimsLocationPayload } from "./LimsLocation.types";

/**
 * LIMS Storage Location API. `.api` is pure HTTP — toasts live in the mutation
 * layer (MIGRATION.md Rule 2).
 */
const ROUTE = "/lims-locations";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsLocationById = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsLocation;
};
const DATA_KEYS = ["locations", "data"];
/** Relations the server returns nested; normalized so `.id` is canonical. */
const RELATION_KEYS = ["group", "parentLocation", "locationType"];

export const fetchLimsLocationList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsLocation>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

export const fetchLimsLocationOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, {
    params: buildServerParams(params),
    signal
  });
  return toOptionsPage<LimsLocation>(
    response.data,
    params,
    (row) => row.locationName,
    DATA_KEYS
  );
};

/**
 * Create/update go out as multipart when files are attached — the record travels
 * as JSON under `data`, files as `attachments` (same shape as gxp-service).
 */
const toBody = (payload: LimsLocationPayload, files?: File[]) => {
  if (!files?.length) return { body: payload, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsLocation = async (payload: LimsLocationPayload, files?: File[]) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsLocation = async (
  id: string,
  payload: LimsLocationPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

/** Soft delete — the row stays for the audit trail and can be restored. */
export const deleteLimsLocation = async (id: string, changeReason: string) => {
  const response = await limsApi.delete(`${ROUTE}/${id}`, { data: { changeReason } });
  return response.data;
};

export const bulkDeleteLimsLocation = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsLocation = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsLocation = async (records: LimsLocationPayload[]) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkCloneLimsLocation = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

export const bulkUpdateLimsLocation = async (
  updates: { id: string; payload: LimsLocationPayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, { updates, changeReason });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsLocation = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsLocationAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { params, signal });
  return response.data;
};
