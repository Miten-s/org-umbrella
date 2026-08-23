import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type {
  LimsInstrument,
  LimsInstrumentPayload
} from "./LimsInstrument.types";

/** LimsInstrument API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-instruments";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsInstrumentById = async (
  id: string,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsInstrument;
};
const DATA_KEYS = ["instruments", "data"];
const RELATION_KEYS = [
  "group",
  "type",
  "measurementType",
  "status",
  "location",
  "supplier"
];

export const fetchLimsInstrumentList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: {
      ...buildServerParams(params),
      includeRemoved: includeRemoved || undefined
    },
    signal
  });
  return toListResult<LimsInstrument>(
    response.data,
    params,
    DATA_KEYS,
    RELATION_KEYS
  );
};

/** Options for other modules selecting this entity. */
export const fetchLimsInstrumentOptions = async (
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
  return toOptionsPage<LimsInstrument>(
    response.data,
    params,
    (row) => String(row.name ?? ""),
    DATA_KEYS
  );
};

const toBody = (payload: LimsInstrumentPayload, files?: File[]) => {
  if (!files?.length) return { body: payload as unknown, config: undefined };
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach((file) => formData.append("attachments", file));
  return {
    body: formData as unknown,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
};

export const createLimsInstrument = async (
  payload: LimsInstrumentPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.post(ROUTE, body, config);
  return response.data;
};

export const updateLimsInstrument = async (
  id: string,
  payload: LimsInstrumentPayload,
  files?: File[]
) => {
  const { body, config } = toBody(payload, files);
  const response = await limsApi.patch(`${ROUTE}/${id}`, body, config);
  return response.data;
};

export const bulkDeleteLimsInstrument = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsInstrument = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

export const restoreLimsInstrument = async (
  id: string,
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, {
    changeReason
  });
  return response.data;
};

export const fetchLimsInstrumentAudit = async (
  id: string,
  signal?: AbortSignal,
  params?: { page?: number; limit?: number }
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, {
    params,
    signal
  });
  return response.data;
};
