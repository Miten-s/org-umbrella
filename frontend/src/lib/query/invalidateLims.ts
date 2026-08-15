import type { QueryClient } from "@tanstack/react-query";

/**
 * Cross-entity references are pervasive in LIMS — a Study embeds its
 * Project's name, a Sample embeds its Location, a Result embeds its Test —
 * so invalidating only the entity that just changed leaves every OTHER
 * entity's already-cached copy of it stale (rename a Project and every
 * loaded Study, and the Project dropdown itself, still shows the old name
 * until a hard refresh). Every LIMS query key starts with a `"lims..."`
 * string, so one predicate-based invalidation after any mutation keeps the
 * whole module consistent — a few extra refetches on save, which is cheap
 * for a tool this size, beats tracking every cross-entity reference by hand.
 */
export const invalidateAllLims = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) =>
      typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("lims")
  });
