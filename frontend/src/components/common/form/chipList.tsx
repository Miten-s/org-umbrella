type ChipListProps = {
  items?: string[];
  empty?: string;
  variant?: "wrap" | "grid";
  columns?: 2 | 3 | 4;
  maxHeightClassName?: string; // e.g. "max-h-44"
};

export const ChipList = ({
  items,
  empty = "-",
  variant = "wrap",
  columns = 3,
  maxHeightClassName
}: ChipListProps) => {
  if (!items || items.length === 0) {
    return <span className="text-gray-900 dark:text-gray-100">{empty}</span>;
  }

  const gridColsClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  const containerClass =
    variant === "grid" ? `grid ${gridColsClass} gap-2` : "flex flex-wrap gap-2";

  return (
    <div
      className={
        maxHeightClassName ? `${maxHeightClassName} overflow-auto pr-1` : ""
      }
    >
      <div className={containerClass}>
        {items.map((text, idx) => (
          <span
            key={`${text}-${idx}`}
            className="max-w-full truncate rounded-full px-2.5 py-1 text-xs
                       bg-slate-50 text-slate-700 border border-slate-200
                       dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            title={text}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
