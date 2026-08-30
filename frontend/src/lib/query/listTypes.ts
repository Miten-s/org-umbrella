import type { ListQueryParams } from "@/utils/listResponse";

/** Sort direction for server-side sorting. */
export type SortDir = "asc" | "desc";

export interface ListSort {
  field: string;
  dir: SortDir;
}

/**
 * Per-field filters sent to the server (Ask #2). Values are scalars or arrays
 * (multi-value filters). Tabs are expressed as a filter too, e.g. { status: "active" }.
 */
export type ListFilters = Record<string, string | number | boolean | string[] | undefined>;

/** Everything a list endpoint may receive. `search` is already debounced upstream. */
export interface ServerListParams extends ListQueryParams {
  sortBy?: string;
  sortDir?: SortDir;
  filters?: ListFilters;
}

/** Normalized result every `fetch<E>List` returns to the query layer. */
export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * One selection shape for every bulk operation — see STANDARDS.md §2.
 * The client NEVER enumerates ids for the filter case; it sends the criteria.
 */
export type BulkSelection =
  | { mode: "ids"; ids: string[] }
  | { mode: "filter"; filters: ListFilters; search?: string; excludeIds?: string[] };

export const idsSelection = (ids: string[]): BulkSelection => ({ mode: "ids", ids });

export const filterSelection = (
  filters: ListFilters,
  search?: string,
  excludeIds?: string[]
): BulkSelection => ({ mode: "filter", filters, search, excludeIds });

/** Option shape used by AsyncSelect / useAsyncOptions. */
export interface AsyncOption {
  value: string;
  label: string;
  /** Optional secondary text / disabled flag for richer menus. */
  sublabel?: string;
  disabled?: boolean;
  /**
   * Optional: the full source record behind this option, for a consumer
   * that needs more than value/label/sublabel to react to a selection —
   * e.g. SubFormGrid's `onSelectOption`, which populates several sibling
   * cells (Min/Max/Unit) from ONE picked Analysis Component. Most options
   * don't set this; it's additive and never required.
   */
  data?: unknown;
}

/** One page returned by an options fetcher (infinite-query friendly). */
export interface OptionsPage {
  options: AsyncOption[];
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null;
}

/**
 * Translate a BulkSelection into a request body for /bulk-delete & /bulk-duplicate.
 * Both id-mode and filter-mode map to the same endpoints (Ask #3). When the backend
 * lacks filter-mode, the UI never offers it (capability `canBulkByFilter`), so this
 * only emits `{ filter }` when it is actually supported.
 */
export const bulkSelectionToBody = (
  selection: BulkSelection
): { ids: string[] } | { filter: ListFilters; search?: string; excludeIds?: string[] } =>
  selection.mode === "ids"
    ? { ids: selection.ids }
    : {
        filter: selection.filters,
        search: selection.search,
        excludeIds: selection.excludeIds
      };
