import {
  extractList,
  extractPaginationMetadata,
  type ListQueryParams
} from "@/utils/listResponse";
import { normalizeList, type WithId } from "./normalizeId";
import type {
  ListFilters,
  ListResult,
  OptionsPage,
  ServerListParams
} from "./listTypes";

/**
 * Flatten `filters` into query params. Sends `filter[key]=value` (arrays repeated).
 * When the backend doesn't support filters yet, callers pass `filters: undefined`
 * (gated by capabilities) so nothing is emitted.
 */
export const buildServerParams = (params: ServerListParams): ListQueryParams => {
  const { filters, sortBy, sortDir, ...rest } = params;
  const flatFilters: Record<string, unknown> = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === "") continue;
      flatFilters[`filter[${key}]`] = value;
    }
  }
  return {
    ...rest,
    ...(sortBy ? { sortBy, sortDir: sortDir ?? "asc" } : {}),
    ...flatFilters
  };
};

/**
 * Convert a raw list API response into the canonical `ListResult<T>`:
 * extracts rows (via preferred keys), normalizes ids, and derives pagination.
 * This is the ONE place list envelopes are massaged — see STANDARDS.md §3/§4.
 */
export const toListResult = <T extends Record<string, any>>(
  response: unknown,
  params: ServerListParams,
  dataKeys: string[] = [],
  relationKeys: string[] = []
): ListResult<WithId<T>> => {
  const rawRows = extractList<T>(response, dataKeys);
  const rows = relationKeys.length
    ? // normalize nested relations too
      (normalizeList(rawRows).map((row) => {
        for (const key of relationKeys) {
          const relation = (row as Record<string, any>)[key];
          if (relation && typeof relation === "object") {
            (row as Record<string, any>)[key] = {
              ...relation,
              id: relation.id ?? relation._id,
              _id: relation.id ?? relation._id
            };
          }
        }
        return row;
      }) as WithId<T>[])
    : normalizeList(rawRows);

  const metadata = extractPaginationMetadata(response, {
    totalCount: rows.length,
    currentPage: params.page ?? 1,
    limit: params.limit ?? rows.length
  });

  return {
    rows,
    total: metadata.totalCount,
    page: metadata.currentPage,
    pageSize: metadata.limit,
    totalPages: metadata.totalPages
  };
};

/**
 * Convert a raw list response into an `OptionsPage` for AsyncSelect.
 * `getLabel` maps a row to its display label; `getValue` defaults to the id.
 */
export const toOptionsPage = <T extends Record<string, any>>(
  response: unknown,
  params: ServerListParams,
  getLabel: (row: WithId<T>) => string,
  dataKeys: string[] = [],
  getValue: (row: WithId<T>) => string = (row) => row.id
): OptionsPage => {
  const rows = normalizeList(extractList<T>(response, dataKeys));
  const metadata = extractPaginationMetadata(response, {
    currentPage: params.page ?? 1,
    limit: params.limit ?? rows.length
  });
  const hasMore = metadata.currentPage < metadata.totalPages;
  return {
    options: rows.map((row) => ({ value: getValue(row), label: getLabel(row) })),
    nextPage: hasMore ? metadata.currentPage + 1 : null
  };
};

/** Convenience re-export for modules building filter params. */
export type { ListFilters };
