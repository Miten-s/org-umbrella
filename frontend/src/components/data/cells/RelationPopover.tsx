import {
  CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ListResult } from "@/lib/query/listTypes";

export interface RelationPopoverProps<T> {
  /** True total behind the relation — how we know a live fetch is even needed. */
  totalCount: number;
  /** Server-driven page fetch, scoped to this one parent (e.g. `?filter[lotId]=X`) —
   * reuse the entity's own list API function, same shape `useAsyncOptions` expects. */
  fetchPage: (
    args: { search: string; page: number },
    signal?: AbortSignal
  ) => Promise<ListResult<T>>;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  headerLabel: string;
  /** Query key prefix — keeps this popover's cache separate per row/relation. */
  queryKey: readonly unknown[];
  className?: string;
}

/**
 * The "+N" trigger for a relation too large to have been fetched in full (see
 * attachRelationCounts / TagListCell's `totalCount`). Unlike CountWithTooltip — which
 * only ever shows whatever was already loaded — this one fetches live, paginated,
 * searchable data on open, because a "+N" over a real cap means the client does NOT
 * already have the rest. Read-only browsing; see RelationManagerModal for edit.
 */
export function RelationPopover<T>({
  totalCount,
  fetchPage,
  getLabel,
  getKey,
  headerLabel,
  queryKey,
  className
}: RelationPopoverProps<T>) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [portalStyle, setPortalStyle] = useState<CSSProperties>();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, "relation-popover", debouncedSearch],
    queryFn: ({ pageParam, signal }) =>
      fetchPage({ search: debouncedSearch, page: pageParam as number }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: isOpen,
    placeholderData: keepPreviousData
  });

  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 12;
    const left = Math.min(
      Math.max(padding, triggerRect.left),
      window.innerWidth - tooltipRect.width - padding
    );
    const top = Math.min(
      Math.max(padding, triggerRect.bottom + 8),
      window.innerHeight - tooltipRect.height - padding
    );
    setPortalStyle({ position: "fixed", left, top });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, rows.length, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => updatePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isOpen, updatePosition]);

  const close = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative shrink-0 ${className ?? ""}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setPortalStyle(undefined);
          setIsOpen((prev) => !prev);
        }}
      >
        {`+${totalCount}`}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              {/* Click-outside layer */}
              <div className="fixed inset-0 z-[1199]" onClick={close} />
              <div
                id={tooltipId}
                ref={tooltipRef}
                role="dialog"
                className={`fixed z-[1200] ${!portalStyle ? "invisible" : ""}`}
                style={portalStyle}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-[320px] max-w-[85vw] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:ring-white/5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {headerLabel} ({totalCount} total)
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Close
                    </button>
                  </div>

                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="mb-2 w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-300 dark:border-slate-700"
                  />

                  <div className="max-h-56 overflow-y-auto">
                    {query.isLoading ? (
                      <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                        Loading…
                      </div>
                    ) : rows.length ? (
                      <ul className="space-y-1">
                        {rows.map((item) => (
                          <li
                            key={getKey(item)}
                            className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {getLabel(item)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No matches
                      </div>
                    )}

                    {query.hasNextPage ? (
                      <button
                        type="button"
                        onClick={() => query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                        className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        {query.isFetchingNextPage ? "Loading…" : "Load more"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

export default RelationPopover;
