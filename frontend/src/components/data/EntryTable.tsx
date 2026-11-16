import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import HelpTooltip from "@/components/common/HelpTooltip";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/public/icons";

/** Rows per page for entry tables; the first is the default. */
const ENTRY_PAGE_SIZES = [20, 30, 50, 100];

export interface EntryTableColumn<R> {
  key: string;
  header: string;
  tooltip?: ReactNode;
  render: (row: R, index: number) => ReactNode;
  className?: string;
}

interface EntryTableProps<R> {
  label: string;
  columns: EntryTableColumn<R>[];
  rows: R[];
  emptyLabel: string;
  /** Row currently open in the entry form, highlighted. */
  activeIndex?: number | null;
  onView?: (index: number) => void;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  /** Marks rows added or changed since the page last saved. */
  isUnsaved?: (row: R) => boolean;
  /** Hides Delete on rows that must stay, e.g. required fields. */
  canDelete?: (row: R) => boolean;
}

const iconButton =
  "rounded p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40";

/** The added rows of an entry form, paged on the client: View · Edit · Delete per row. */
function EntryTable<R>({
  label,
  columns,
  rows,
  emptyLabel,
  activeIndex,
  onView,
  onEdit,
  onDelete,
  isUnsaved,
  canDelete
}: EntryTableProps<R>) {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(ENTRY_PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));

  // Jump to the last page when a row is added, and stay in range when rows are removed.
  const [count, setCount] = useState(rows.length);
  useEffect(() => {
    if (rows.length > count) setPage(Math.ceil(rows.length / pageSize));
    else if (page > pages) setPage(pages);
    setCount(rows.length);
  }, [rows.length, count, page, pages, pageSize]);

  const start = (page - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);
  const hasActions = Boolean(onView || onEdit || onDelete);

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="w-10 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300"
              >
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 ${column.className ?? ""}`}
                >
                  {column.header}
                  {column.tooltip ? (
                    <HelpTooltip content={column.tooltip} />
                  ) : null}
                </th>
              ))}
              {hasActions ? (
                <th
                  scope="col"
                  className="w-28 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300"
                >
                  {t("actions")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {visible.length ? (
              visible.map((row, i) => {
                const index = start + i;
                return (
                  <tr
                    key={index}
                    className={
                      activeIndex === index
                        ? "bg-gray-50 dark:bg-white/5"
                        : undefined
                    }
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-400">
                      {index + 1}
                      {isUnsaved?.(row) ? (
                        <span className="ml-2 rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-300">
                          {t("entryUnsaved")}
                        </span>
                      ) : null}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200 ${column.className ?? ""}`}
                      >
                        {column.render(row, index)}
                      </td>
                    ))}
                    {hasActions ? (
                      <td className="whitespace-nowrap px-3 py-1.5 text-right">
                        {onView ? (
                          <button
                            type="button"
                            aria-label={`${t("limsEntryView")} ${label} ${index + 1}`}
                            title={t("limsEntryView")}
                            onClick={() => onView(index)}
                            className={`${iconButton} text-gray-600 dark:text-gray-300`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onEdit ? (
                          <button
                            type="button"
                            aria-label={`${t("edit")} ${label} ${index + 1}`}
                            title={t("edit")}
                            onClick={() => onEdit(index)}
                            className={`${iconButton} text-brand-600 dark:text-brand-400`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onDelete && (canDelete?.(row) ?? true) ? (
                          <button
                            type="button"
                            aria-label={`${t("delete")} ${label} ${index + 1}`}
                            title={t("delete")}
                            onClick={() => onDelete(index)}
                            className={`${iconButton} text-red-600 dark:text-red-400`}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1 + (hasActions ? 1 : 0)}
                  className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > ENTRY_PAGE_SIZES[0] ? (
        <div className="mt-2 flex flex-wrap items-center justify-end gap-3 text-sm text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2">
            {t("entryRowsPerPage")}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-700"
            >
              {ENTRY_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            {start + 1}–{Math.min(start + pageSize, rows.length)} /{" "}
            {rows.length}
          </span>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-300 px-2.5 py-1 disabled:opacity-40 dark:border-gray-700"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-300 px-2.5 py-1 disabled:opacity-40 dark:border-gray-700"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default EntryTable;
