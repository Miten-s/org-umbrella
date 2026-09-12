import CountWithTooltip from "@/components/common/CountWithTooltip";
import RelationPopover from "@/components/data/cells/RelationPopover";
import type { ReactNode } from "react";
import type { ListResult } from "@/lib/query/listTypes";

interface TagListCellProps<T> {
  /** Items to render — may already be capped server-side (see `totalCount`). */
  items: T[] | undefined | null;
  /**
   * True count of the full relation, when `items` is a server-side-capped
   * sample of it rather than the complete list (e.g. a hasMany relation
   * fetched with `separate: true, limit: N` — see lot.routes.ts). When set,
   * the "+N" badge and tooltip header are computed from this instead of
   * `items.length`, so a lot with 100k samples but only 20 returned still
   * shows the true "+99,998" instead of an accidental "+18".
   */
  totalCount?: number;
  /**
   * Live, paginated, searchable fetch scoped to this one row's relation (e.g.
   * `fetchLimsSampleList` filtered by `lotId`) — required to make the "+N"
   * clickable and browsable when `totalCount` exceeds what's already loaded.
   * Without it, a capped-but-large relation falls back to a static "showing
   * first N" tooltip rather than a live popover. See RelationPopover.
   */
  fetchPage?: (
    args: { search: string; page: number },
    signal?: AbortSignal
  ) => Promise<ListResult<T>>;
  /** Query key prefix for `fetchPage`'s cache — typically `[entity, rowId, relationName]`. */
  queryKey?: readonly unknown[];
  /** How many to show inline before collapsing the rest into "+N". Default 2. */
  max?: number;
  /** Text for an item — used for the default chip and the tooltip list. */
  getLabel: (item: T) => string;
  /** Stable key per item (defaults to the label). */
  getKey?: (item: T, index: number) => string;
  /** Custom inline chip renderer (defaults to a blue pill of `getLabel`). */
  renderItem?: (item: T) => ReactNode;
  /** Header shown at the top of the overflow tooltip. */
  tooltipHeaderLabel?: string;
  /** Rendered when there are no items. Defaults to "-". */
  emptyFallback?: ReactNode;
}

const defaultChip = (label: string) => (
  <span className="block max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
    {label}
  </span>
);

/**
 * Shared list cell: shows the first `max` items inline, then a "+N" that reveals
 * the rest on hover (via CountWithTooltip). Use this for ANY multi-item array in
 * a table cell — roles, tags, members, permissions — so overflow behaves
 * identically everywhere (MIGRATION.md §8).
 */
export function TagListCell<T>({
  items,
  totalCount,
  fetchPage,
  queryKey,
  max = 2,
  getLabel,
  getKey,
  renderItem,
  tooltipHeaderLabel,
  emptyFallback = "-"
}: TagListCellProps<T>) {
  const list = items ?? [];
  if (!list.length) {
    return (
      <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
        {emptyFallback}
      </div>
    );
  }

  const visible = list.slice(0, max);
  const overflow = list.slice(max);
  const total = totalCount ?? list.length;
  const overflowCount = totalCount != null ? total - visible.length : overflow.length;

  return (
    // Single-line (flex-nowrap) so the cell never grows taller than the row and
    // spills into neighbouring rows. Chips shrink+truncate when tight; the "+N"
    // stays pinned (shrink-0) and always visible.
    <div className="flex flex-nowrap items-center gap-2 overflow-hidden py-1.5">
      {visible.map((item, index) => (
        <span
          key={getKey ? getKey(item, index) : `${getLabel(item)}-${index}`}
          className="min-w-0"
        >
          {renderItem ? renderItem(item) : defaultChip(getLabel(item))}
        </span>
      ))}
      {overflowCount > 0 ? (
        <div className="shrink-0">
          {totalCount != null && totalCount > list.length && fetchPage ? (
            // Capped and there's genuinely more than we loaded — a static
            // tooltip would just show the same truncated array again, so
            // this fetches the rest live, paginated and searchable, instead.
            <RelationPopover
              totalCount={totalCount}
              fetchPage={fetchPage}
              getLabel={getLabel}
              getKey={(item) => (getKey ? getKey(item, 0) : getLabel(item))}
              headerLabel={tooltipHeaderLabel ?? "Items"}
              queryKey={queryKey ?? [tooltipHeaderLabel ?? "relation"]}
              className="self-center"
            />
          ) : (
            <CountWithTooltip
              count={overflowCount}
              items={overflow.map(getLabel)}
              headerLabel={tooltipHeaderLabel ?? `${total} total`}
              subLabel={
                totalCount != null && totalCount > list.length
                  ? `Showing first ${list.length}`
                  : undefined
              }
              className="self-center"
              portal
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default TagListCell;
