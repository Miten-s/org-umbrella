import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import { getCapabilities, type TableCapabilities } from "@/lib/query/capabilities";
import {
  filterSelection,
  idsSelection,
  type BulkSelection,
  type ListFilters,
  type ListResult,
  type ListSort,
  type ServerListParams
} from "@/lib/query/listTypes";
import { DEFAULT_LIST_PAGE_SIZE } from "@/utils/listResponse";

export interface UseServerTableOptions<T> {
  /** Entity slug used to look up capabilities (STANDARDS.md §10). */
  entity: string;
  /** Base React Query key for this list, e.g. designationKeys.all. */
  queryKey: readonly unknown[];
  /** List fetcher — receives fully-resolved params + an abort signal. */
  fetchList: (
    params: ServerListParams,
    signal?: AbortSignal
  ) => Promise<ListResult<T>>;
  /** Stable id accessor for selection. Defaults to `row.id`. */
  getRowId?: (row: T) => string;
  initialPageSize?: number;
  initialSort?: ListSort;
  initialFilters?: ListFilters;
  searchDebounceMs?: number;
  /** Override auto-resolved capabilities (rarely needed). */
  capabilities?: Partial<TableCapabilities>;
  enabled?: boolean;
}

const defaultGetRowId = <T>(row: T): string =>
  String((row as { id?: unknown }).id ?? "");

/**
 * Owns ALL list query state: page, pageSize, sort, filters, debounced search,
 * and a scalable selection model. Built on React Query (cache/dedupe/cancel).
 * See STANDARDS.md §6.
 *
 * Unsupported affordances are hidden, never faked: `setSort` is a no-op when
 * `!canSort`; filters only apply when `canFilter`; "select all matching" is only
 * offered when `canBulkByFilter`.
 */
export const useServerTable = <T>({
  entity,
  queryKey,
  fetchList,
  getRowId = defaultGetRowId,
  initialPageSize = DEFAULT_LIST_PAGE_SIZE,
  initialSort,
  initialFilters = {},
  searchDebounceMs = 300,
  capabilities,
  enabled = true
}: UseServerTableOptions<T>) => {
  const caps = useMemo<TableCapabilities>(
    () => ({ ...getCapabilities(entity), ...capabilities }),
    [entity, capabilities]
  );

  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [sort, setSortState] = useState<ListSort | undefined>(
    caps.canSort ? initialSort : undefined
  );
  const [filters, setFiltersState] = useState<ListFilters>(initialFilters);
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebouncedValue(rawSearch.trim(), searchDebounceMs);

  // Selection model — source of truth for bulk actions (scales past one page).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);

  const effectiveFilters = useMemo(
    () => (caps.canFilter ? filters : {}),
    [caps.canFilter, filters]
  );

  const params = useMemo<ServerListParams>(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      sortBy: caps.canSort ? sort?.field : undefined,
      sortDir: caps.canSort ? sort?.dir : undefined,
      filters: caps.canFilter ? effectiveFilters : undefined
    }),
    [page, pageSize, search, sort, caps.canSort, caps.canFilter, effectiveFilters]
  );

  const query = useQuery<ListResult<T>>({
    queryKey: [...queryKey, "list", params],
    queryFn: ({ signal }) => fetchList(params, signal),
    placeholderData: keepPreviousData,
    enabled
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  // --- setters (reset page where it affects the result window) ---
  const setPage = useCallback((next: number) => setPageState(Math.max(1, next)), []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPageState(1);
  }, []);

  const setSort = useCallback(
    (next: ListSort | undefined) => {
      if (!caps.canSort) return; // hidden, not faked
      setSortState(next);
      setPageState(1);
    },
    [caps.canSort]
  );

  const setFilter = useCallback(
    (key: string, value: ListFilters[string]) => {
      if (!caps.canFilter) return;
      setFiltersState((prev) => ({ ...prev, [key]: value }));
      setPageState(1);
      // changing the result set invalidates any "select all matching"
      setAllMatchingSelected(false);
      setSelectedIds(new Set());
    },
    [caps.canFilter]
  );

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPageState(1);
    setAllMatchingSelected(false);
    setSelectedIds(new Set());
  }, []);

  const setSearch = useCallback((value: string) => {
    setRawSearch(value);
    setPageState(1);
    setAllMatchingSelected(false);
    setSelectedIds(new Set());
  }, []);

  // --- selection helpers ---
  const toggleRow = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
    // TODO(BACKEND_ASKS #3 — canBulkByFilter): today, toggling a row while in
    // "all matching" mode collapses to an explicit id set. Once filter-based batch
    // ships, keep all-matching mode and track de-selections as `excludeIds` so
    // "all N matching MINUS these" is preserved instead of falling back to ids.
    setAllMatchingSelected(false);
  }, []);

  const setPageSelection = useCallback((ids: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return next;
    });
    setAllMatchingSelected(false);
  }, []);

  const selectAllMatching = useCallback(() => {
    if (!caps.canBulkByFilter) return; // affordance hidden otherwise
    setAllMatchingSelected(true);
    setSelectedIds(new Set());
  }, [caps.canBulkByFilter]);

  const clearSelection = useCallback(() => {
    setAllMatchingSelected(false);
    setSelectedIds(new Set());
  }, []);

  /**
   * The BulkSelection consumed by bulk actions. In "all matching" mode we send
   * the filter criteria + search (server resolves the set) — the client never
   * enumerates ids. Otherwise we send the explicitly selected ids.
   */
  const resolveBulkSelection = useCallback((): BulkSelection => {
    if (allMatchingSelected && caps.canBulkByFilter) {
      return filterSelection(effectiveFilters, search || undefined);
    }
    return idsSelection([...selectedIds]);
  }, [allMatchingSelected, caps.canBulkByFilter, effectiveFilters, search, selectedIds]);

  const selectionCount = allMatchingSelected ? total : selectedIds.size;
  const hasSelection = allMatchingSelected || selectedIds.size > 0;

  return {
    // data
    rows,
    total,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // query state
    page,
    pageSize,
    sort,
    filters,
    search: rawSearch,
    capabilities: caps,

    // setters
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilters,
    setSearch,

    // selection
    selectedIds,
    allMatchingSelected,
    selectionCount,
    hasSelection,
    toggleRow,
    setPageSelection,
    selectAllMatching,
    clearSelection,
    resolveBulkSelection,
    getRowId
  };
};

export type UseServerTableReturn<T> = ReturnType<typeof useServerTable<T>>;
