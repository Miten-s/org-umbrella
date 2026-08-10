import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { LimsPhrase, LimsPhrasePayload } from "./LimsPhrase.types";

/** LIMS Pick List API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-phrases";
const DATA_KEYS = ["phrases", "data"];
const RELATION_KEYS = ["group"];

/**
 * Phrase codes seeded by the backend. Each drives one "pick from a list"
 * dropdown elsewhere in LIMS — see LIMS_BACKEND_SPEC.md §6.
 */
export const PHRASE_CODES = {
  RATING: "RATING",
  LOCATION_TYPE: "LOCATION_TYPE",
  STOCK_TYPE: "STOCK_TYPE",
  STOCK_BATCH_STATUS: "STOCK_BATCH_STATUS",
  PARAMETER_TYPE: "PARAMETER_TYPE",
  INSTRUMENT_TYPE: "INSTRUMENT_TYPE",
  MEASUREMENT_TYPE: "MEASUREMENT_TYPE",
  INSTRUMENT_STATUS: "INSTRUMENT_STATUS",
  CALIBRATION_TYPE: "CALIBRATION_TYPE",
  CALIBRATION_STATUS: "CALIBRATION_STATUS",
  ANALYSIS_TYPE: "ANALYSIS_TYPE",
  APPROVAL_STATUS: "APPROVAL_STATUS",
  SAMPLE_TYPE: "SAMPLE_TYPE"
} as const;

export type PhraseCode = (typeof PHRASE_CODES)[keyof typeof PHRASE_CODES];

export const fetchLimsPhraseList = async (
  includeRemoved: boolean,
  params: ServerListParams,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(ROUTE, {
    params: { ...buildServerParams(params), includeRemoved: includeRemoved || undefined },
    signal
  });
  return toListResult<LimsPhrase>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

interface PhraseEntryRow extends Record<string, unknown> {
  id: string;
  phraseEntryId?: string;
  name?: string;
}

/**
 * Values of one pick list, for the dropdowns across LIMS.
 * `GET /lims-phrases/entries?phrase=CODE`
 */
export const fetchPhraseEntryOptions =
  (phrase: PhraseCode) =>
  async (args: { search: string; page: number }, signal?: AbortSignal) => {
    const params: ServerListParams = {
      page: args.page,
      limit: 20,
      search: args.search || undefined
    };
    const response = await limsApi.get(`${ROUTE}/entries`, {
      params: { ...params, phrase },
      signal
    });
    return toOptionsPage<PhraseEntryRow>(
      response.data,
      params,
      (row) => String(row.name ?? row.phraseEntryId ?? ""),
      ["entries", "phraseEntries", "data"]
    );
  };

export const createLimsPhrase = async (payload: LimsPhrasePayload) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsPhrase = async (id: string, payload: LimsPhrasePayload) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsPhrase = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsPhrase = async (selection: BulkSelection) => {
  const response = await limsApi.post(`${ROUTE}/bulk-duplicate`, bulkSelectionToBody(selection));
  return response.data;
};

export const restoreLimsPhrase = async (id: string, changeReason: string) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, { changeReason });
  return response.data;
};

export const fetchLimsPhraseAudit = async (id: string, signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/${id}/audit`, { signal });
  return response.data;
};
