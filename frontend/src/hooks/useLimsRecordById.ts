import { useQuery } from "@tanstack/react-query";

export interface UseLimsRecordByIdParams<T> {
  /** Base React Query key for this entity, e.g. limsTestKeys.all. */
  queryKey: readonly unknown[];
  /** The entity's `fetchLimsXById(id, signal)` API function. */
  fetchById: (id: string, signal?: AbortSignal) => Promise<T>;
  id?: string;
  /** Gate the fetch on the modal actually being open, same as `useAsyncOptions`. */
  enabled?: boolean;
}

/**
 * Fetches the full record for the Edit/View modal, on demand, when it opens
 * — not the row already sitting in the list query's cache.
 *
 * The list table only ever needed a handful of display columns, but every
 * List component was passing its list row straight into the form as
 * `initialData`, so the list API had to return the FULL record (every
 * relation, every child grid, every attachment) just so editing had
 * something to populate the form with — on tables sized for hundreds of
 * thousands to millions of rows. This is what lets the list response shrink
 * safely: the modal now fetches its own copy of the one record it needs,
 * the moment it needs it, via the read-only, permission-scoped GET/:id route
 * every entity already exposes.
 */
export const useLimsRecordById = <T>({
  queryKey,
  fetchById,
  id,
  enabled = true
}: UseLimsRecordByIdParams<T>) =>
  useQuery({
    queryKey: [...queryKey, "detail", id ?? "none"],
    queryFn: ({ signal }) => fetchById(id as string, signal),
    enabled: enabled && Boolean(id),
    // The global 30s staleTime otherwise lets a reopen right after a save
    // reuse the pre-save cached copy while the invalidated refetch is still
    // in flight (same class of bug fixed the same way in
    // GxpApplication.queries.ts) — every open of this record must be current.
    staleTime: 0
  });
