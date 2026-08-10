import CountWithTooltip from "@/components/common/CountWithTooltip";
import type { ReactNode } from "react";

interface TagListCellProps<T> {
  /** Full list of items to render. */
  items: T[] | undefined | null;
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
  max = 2,
  getLabel,
  getKey,
  renderItem,
  tooltipHeaderLabel,
  emptyFallback = "-"
}: TagListCellProps<T>) {
  const list = items ?? [];
  if (!list.length) {
    return <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">{emptyFallback}</div>;
  }

  const visible = list.slice(0, max);
  const overflow = list.slice(max);

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
      {overflow.length ? (
        <div className="shrink-0">
          <CountWithTooltip
            count={overflow.length}
            items={overflow.map(getLabel)}
            headerLabel={tooltipHeaderLabel ?? `${list.length} total`}
            className="self-center"
            portal
          />
        </div>
      ) : null}
    </div>
  );
}

export default TagListCell;
