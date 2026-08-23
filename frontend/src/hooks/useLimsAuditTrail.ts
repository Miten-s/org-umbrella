import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { extractList, extractPaginationMetadata } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";

export interface UseLimsAuditTrailParams {
  /** Base React Query key for this entity's audit trail, e.g. limsSampleKeys.audit(id). */
  queryKey: readonly unknown[];
  /** The entity's `fetchLimsXAudit(id, signal, { page, limit })` API function. */
  fetchPage: (
    id: string,
    signal: AbortSignal | undefined,
    params: { page: number; limit: number }
  ) => Promise<unknown>;
  id?: string;
  /** Rows per page. Defaults to 5 — "latest 5, load more on scroll". */
  pageSize?: number;
}

/**
 * Audit trails were loading the server's default page (up to 20 rows) in one
 * shot and had no way to see anything beyond that — a real problem for a
 * high-volume, audit-critical entity like Results. This is the shared
 * infinite-scroll fetcher `AuditTrailDialog` pages through, mirroring how
 * `useAsyncOptions` already pages an AsyncSelect's dropdown.
 */
export const useLimsAuditTrail = ({
  queryKey,
  fetchPage,
  id,
  pageSize = 5
}: UseLimsAuditTrailParams) => {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, id ?? "none", pageSize],
    queryFn: async ({ pageParam, signal }) => {
      const page = pageParam as number;
      const response = await fetchPage(id as string, signal, { page, limit: pageSize });
      const entries = extractList<LimsAuditEntry>(response, ["audit", "auditTrail", "entries"]);
      // The audit endpoint returns `{ audit, total }`, not a `metadata` block —
      // fall back to computing totalPages from `total` the same way the list
      // adapter does for every other paginated response in the app.
      const totalRaw =
        response && typeof response === "object" && "total" in (response as Record<string, unknown>)
          ? Number((response as Record<string, unknown>).total)
          : entries.length;
      const metadata = extractPaginationMetadata(response, {
        currentPage: page,
        limit: pageSize,
        totalCount: totalRaw
      });
      return { entries, hasMore: metadata.currentPage < metadata.totalPages };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    enabled: Boolean(id)
  });

  const entries = useMemo(
    () => query.data?.pages.flatMap((page) => page.entries) ?? [],
    [query.data]
  );

  return {
    entries,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage
  };
};
