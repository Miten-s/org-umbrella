import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import type { AsyncOption, OptionsPage } from "@/lib/query/listTypes";

export interface UseAsyncOptionsParams {
  /** Base React Query key for these options, e.g. designationKeys.options. */
  queryKey: readonly unknown[];
  /** Fetches one page of options from the server (typeahead + pagination). */
  fetchPage: (
    args: { search: string; page: number },
    signal?: AbortSignal
  ) => Promise<OptionsPage>;
  /**
   * Resolves labels for already-selected value(s) that may not be on the loaded
   * pages (editing an existing record). Supported when `canResolveByIds`; when
   * absent the currently-loaded options are used as the only label source.
   */
  resolveByIds?: (ids: string[], signal?: AbortSignal) => Promise<AsyncOption[]>;
  /** Currently selected value(s) — used to resolve labels not yet loaded. */
  selectedValues?: string[];
  /** Raw typeahead term (debounced internally). */
  search: string;
  debounceMs?: number;
  /** Only fetch when the dropdown is open. */
  enabled?: boolean;
}

/**
 * Server-driven options for AsyncSelect — see STANDARDS.md §5.
 *
 * - Never loads all: pages come from the server via `useInfiniteQuery`.
 * - Debounce (~300ms) lives HERE so the term joins the query key and dedupes.
 * - `enabled` gates fetching to when the dropdown is open (no eager load).
 * - Resolves selected value labels by id so editing shows the right label even
 *   when the value sits on page 900.
 */
export const useAsyncOptions = ({
  queryKey,
  fetchPage,
  resolveByIds,
  selectedValues = [],
  search,
  debounceMs = 300,
  enabled = true
}: UseAsyncOptionsParams) => {
  const debouncedSearch = useDebouncedValue(search.trim(), debounceMs);

  const listQuery = useInfiniteQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: ({ pageParam, signal }) =>
      fetchPage({ search: debouncedSearch, page: pageParam as number }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage: OptionsPage) => lastPage.nextPage,
    enabled,
    // Without this, typing a new search term is a different query key, so
    // `data` goes briefly `undefined` (not just "loading") while it
    // refetches — the rendered list drops to empty/loading and then
    // reappears with a new array, right as a virtualized row a viewer just
    // clicked could still be mid-transition. Keeping the previous page
    // visible until the new one lands removes that window entirely.
    placeholderData: keepPreviousData
  });

  const loadedOptions = useMemo<AsyncOption[]>(
    () => listQuery.data?.pages.flatMap((p) => p.options) ?? [],
    [listQuery.data]
  );

  // Which selected values are missing from the loaded pages?
  const loadedValueSet = useMemo(
    () => new Set(loadedOptions.map((o) => o.value)),
    [loadedOptions]
  );
  const unresolvedIds = useMemo(
    () => selectedValues.filter((v) => v && !loadedValueSet.has(v)),
    [selectedValues, loadedValueSet]
  );

  // Resolve labels for the missing selected values (only when there are any).
  const resolveQuery = useQuery({
    queryKey: [...queryKey, "resolve", [...unresolvedIds].sort()],
    queryFn: ({ signal }) => resolveByIds!(unresolvedIds, signal),
    enabled: Boolean(resolveByIds) && unresolvedIds.length > 0
  });

  const resolvedSelected = resolveQuery.data ?? [];

  return {
    /** Options loaded from the server (paged). */
    options: loadedOptions,
    /** Resolved-by-id labels for selected values not present in `options`. */
    resolvedSelected,
    isLoading: listQuery.isLoading,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    hasNextPage: Boolean(listQuery.hasNextPage),
    fetchNextPage: listQuery.fetchNextPage,
    isError: listQuery.isError,
    refetch: listQuery.refetch
  };
};

export type UseAsyncOptionsReturn = ReturnType<typeof useAsyncOptions>;
