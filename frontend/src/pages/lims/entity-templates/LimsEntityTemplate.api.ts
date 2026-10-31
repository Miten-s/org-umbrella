import limsApi from "@/utils/lims.axios.interceptor";
import {
  buildServerParams,
  toListResult,
  toOptionsPage
} from "@/lib/query/listAdapter";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type {
  EntityCatalog,
  EntityRecordPage,
  LimsEntityTemplate,
  LimsEntityTemplatePayload,
  QueryGroup
} from "./LimsEntityTemplate.types";

/** LIMS Entity Template API. Pure HTTP — toasts live in the mutation layer. */
const ROUTE = "/lims-entity-templates";

/** Full record for the Edit/View modal — fetched on demand when it opens,
 * not reused from the list row (see useLimsRecordById). */
export const fetchLimsEntityTemplateById = async (
  id: string,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(`${ROUTE}/${id}`, { signal });
  return (response.data?.data ?? response.data) as LimsEntityTemplate;
};

export const fetchEntityCatalog = async (signal?: AbortSignal) => {
  const response = await limsApi.get(`${ROUTE}/catalog`, { signal });
  return response.data as EntityCatalog;
};

const toPage = (data: EntityRecordPage, page: number) => ({
  options: data.data.map((row) => ({ value: row.id, label: row.label })),
  nextPage: data.hasMore ? page + 1 : null
});

/** Values a rule can pick for a pick-list or table field. */
export const fetchFieldOptions = async (
  entity: string,
  field: string,
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const response = await limsApi.get(
    `${ROUTE}/catalog/${entity}/${field}/options`,
    { params: args, signal }
  );
  return toPage(response.data, args.page);
};

export const previewEntityQuery = async (entity: string, query: QueryGroup) => {
  const response = await limsApi.post(`${ROUTE}/preview`, { entity, query });
  return response.data as EntityRecordPage;
};

/** The templates a Test Template component on this table can use. */
export const fetchTemplatesForEntity = async (
  entity: string,
  signal?: AbortSignal
) => {
  const response = await limsApi.get(`${ROUTE}/for-entity/${entity}`, {
    signal
  });
  return response.data.data as {
    id: string;
    entityTemplateId: string;
    name: string;
  }[];
};

/** The records a template matches right now, for the analyst's dropdown. */
export const fetchEntityRecords = async (
  id: string,
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const response = await limsApi.get(`${ROUTE}/${id}/records`, {
    params: args,
    signal
  });
  return toPage(response.data, args.page);
};

const DATA_KEYS = ["entityTemplates", "data"];
const RELATION_KEYS = ["group"];

export const fetchLimsEntityTemplateList = async (
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
  return toListResult<LimsEntityTemplate>(
    response.data,
    params,
    DATA_KEYS,
    RELATION_KEYS
  );
};

/** Options for other modules selecting this entity. */
export const fetchLimsEntityTemplateOptions = async (
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
  return toOptionsPage<LimsEntityTemplate>(
    response.data,
    params,
    (row) => row.name,
    DATA_KEYS
  );
};

export const createLimsEntityTemplate = async (
  payload: LimsEntityTemplatePayload
) => {
  const response = await limsApi.post(ROUTE, payload);
  return response.data;
};

export const updateLimsEntityTemplate = async (
  id: string,
  payload: LimsEntityTemplatePayload
) => {
  const response = await limsApi.patch(`${ROUTE}/${id}`, payload);
  return response.data;
};

export const bulkDeleteLimsEntityTemplate = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-delete`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkRestoreLimsEntityTemplate = async (
  selection: BulkSelection,
  changeReason: string
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-restore`, {
    ...bulkSelectionToBody(selection),
    changeReason
  });
  return response.data;
};

export const bulkCloneLimsEntityTemplate = async (selection: BulkSelection) => {
  const response = await limsApi.post(
    `${ROUTE}/bulk-duplicate`,
    bulkSelectionToBody(selection)
  );
  return response.data;
};

/**
 * The Copy flow's one and only network call — every reviewed record is
 * sent together, once. See `bulkCreate` in crud-factory.ts.
 */
export const bulkCopyLimsEntityTemplate = async (
  records: LimsEntityTemplatePayload[]
) => {
  const response = await limsApi.post(`${ROUTE}/bulk-copy`, { records });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; warning?: string }[];
  };
};

export const bulkUpdateLimsEntityTemplate = async (
  updates: { id: string; payload: LimsEntityTemplatePayload }[],
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/bulk-update`, {
    updates,
    changeReason
  });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};

export const restoreLimsEntityTemplate = async (
  id: string,
  changeReason: string
) => {
  const response = await limsApi.patch(`${ROUTE}/restore/${id}`, {
    changeReason
  });
  return response.data;
};

export const fetchLimsEntityTemplateAudit = async (
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
