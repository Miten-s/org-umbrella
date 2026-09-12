import { useState } from "react";
import { useInfiniteQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { UseAsyncOptionsParams } from "@/hooks/useAsyncOptions";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { ListResult } from "@/lib/query/listTypes";
import { CloseLineIcon } from "@/public/icons";
import { invalidateAllLims } from "@/lib/query/invalidateLims";

interface RelationManagerModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalCount: number;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  queryKey: readonly unknown[];
  /** Live, paginated, searchable fetch of everything CURRENTLY attached. */
  fetchAttached: (
    args: { search: string; page: number },
    signal?: AbortSignal
  ) => Promise<ListResult<T>>;
  /** Same `useOptions` hook shape AsyncSelect takes — search across candidates to add.
   * Picking one attaches it immediately; it isn't held in any form state. */
  useCandidateOptions: (
    args: Pick<UseAsyncOptionsParams, "search" | "enabled" | "selectedValues">
  ) => ReturnType<typeof useAsyncOptions>;
  onAttach: (id: string) => Promise<void>;
  onDetach: (id: string) => Promise<void>;
}

/**
 * Edit-time counterpart to RelationPopover: same capped-relation problem, but here the
 * user needs to add/remove, not just browse. Every action below is its own immediate
 * API call (POST/DELETE .../:id/children/:field) — nothing is buffered into form state
 * and resent as "the complete set" on some outer Save, which is what made the old
 * multi-select unsafe once a relation could hold more than the form ever loaded.
 */
export function RelationManagerModal<T>({
  isOpen,
  onClose,
  title,
  totalCount,
  getLabel,
  getKey,
  queryKey,
  fetchAttached,
  useCandidateOptions,
  onAttach,
  onDetach
}: RelationManagerModalProps<T>) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const attachedQuery = useInfiniteQuery({
    queryKey: [...queryKey, "manager-attached", debouncedSearch],
    queryFn: ({ pageParam, signal }) =>
      fetchAttached({ search: debouncedSearch, page: pageParam as number }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: isOpen,
    placeholderData: keepPreviousData
  });

  const rows = attachedQuery.data?.pages.flatMap((p) => p.rows) ?? [];
  const attachedIds = rows.map((item) => getKey(item));

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: [...queryKey, "manager-attached"] });
    // The row's own capped preview + count (list column / view) needs refreshing too.
    queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
    // Both sides of the relation have their own list table cached separately
    // (e.g. Batches AND Lots) — a narrow invalidate of just this modal's own
    // query key never touches either one, which is exactly why the Batches
    // table kept showing "-" after attaching a Lot here. Every normal
    // create/update mutation already sweeps with this; attach/detach need
    // the same sweep, not a hand-rolled subset of it.
    invalidateAllLims(queryClient);
  };

  const handleAttach = async (id: string) => {
    setPendingId(id);
    try {
      await onAttach(id);
      // Clears the "current" filter so the freshly attached row is guaranteed
      // to land in `rows` on refetch — otherwise a stale filter could hide it,
      // making the AsyncSelect binding below (attachedIds) briefly wrong.
      setSearch("");
      refetchAll();
    } finally {
      setPendingId(null);
    }
  };

  const handleDetach = async (id: string) => {
    setPendingId(id);
    try {
      await onDetach(id);
      refetchAll();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {totalCount} total — each add/remove below saves immediately.
        </p>

        <div className="mb-3">
          <AsyncSelect
            multi
            useOptions={useCandidateOptions}
            value={attachedIds}
            // `rows` already has real names (it's what the list below renders) — without
            // this, AsyncSelect only resolves a chip's label via its own resolve-by-id
            // fetch, which is gated on the dropdown being open, so a closed trigger
            // (the default state) fell through to the raw id.
            initialSelectedOptions={rows.map((item) => ({
              value: getKey(item),
              label: getLabel(item)
            }))}
            onChange={(ids) => {
              // Multi mode never auto-closes on pick (single mode does — see
              // AsyncSelect's handlePick), and bound to the real attached ids
              // it also highlights/chips them like any other multi-select —
              // a plain local toggle gave no feedback that a pick registered.
              const added = ids.find((id) => !attachedIds.includes(id));
              const removed = attachedIds.find((id) => !ids.includes(id));
              if (added) handleAttach(added);
              else if (removed) handleDetach(removed);
            }}
            placeholder="Search to add…"
          />
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search current…"
          className="mb-2 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-300 dark:border-gray-700"
        />

        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
          {attachedQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
          ) : rows.length ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((item) => {
                const id = getKey(item);
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                      {getLabel(item)}
                    </span>
                    <button
                      type="button"
                      disabled={pendingId === id}
                      onClick={() => handleDetach(id)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10"
                      aria-label={`Remove ${getLabel(item)}`}
                    >
                      <CloseLineIcon className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">No matches</div>
          )}

          {attachedQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => attachedQuery.fetchNextPage()}
              disabled={attachedQuery.isFetchingNextPage}
              className="w-full border-t border-gray-100 py-2 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              {attachedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RelationManagerModal;
