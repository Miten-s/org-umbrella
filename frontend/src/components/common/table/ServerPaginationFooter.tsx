import { ChevronLeftIcon } from "@/public/icons";
import type { ReactNode } from "react";

const PagerButton = ({
  label,
  disabled,
  onClick,
  children
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
  >
    {children}
  </button>
);

export interface ServerPaginationFooterProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
  disabled?: boolean;
  pageSizeOptions?: number[] | false;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Shared server-pagination footer (page-size select + range summary + First/
 * Prev/Next/Last). Consumed by BOTH AppDataTable and DataTable so pager logic
 * lives in ONE place (migration guardrail).
 */
export const ServerPaginationFooter = ({
  currentPage,
  totalPages,
  pageSize,
  totalRows,
  disabled = false,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange
}: ServerPaginationFooterProps) => {
  const safeTotalPages = Math.max(1, totalPages);
  const page = Math.min(Math.max(1, currentPage), safeTotalPages);
  const firstRow = totalRows ? (page - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(page * pageSize, totalRows);

  return (
    <div className="flex min-h-16 flex-col gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-end">
      {pageSizeOptions !== false && onPageSizeChange ? (
        <label className="flex items-center justify-end gap-2">
          <span>Page Size:</span>
          <select
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-50 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <span className="text-right">
        {firstRow} to {lastRow} of {totalRows}
      </span>
      <span className="text-right font-medium">
        Page {page} of {safeTotalPages}
      </span>

      <div className="flex justify-end gap-2">
        <PagerButton label="First page" disabled={page <= 1 || disabled} onClick={() => onPageChange(1)}>
          <ChevronLeftIcon className="h-4 w-4" />
          <ChevronLeftIcon className="-ml-2 h-4 w-4" />
        </PagerButton>
        <PagerButton label="Previous page" disabled={page <= 1 || disabled} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </PagerButton>
        <PagerButton
          label="Next page"
          disabled={page >= safeTotalPages || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronLeftIcon className="h-4 w-4 rotate-180" />
        </PagerButton>
        <PagerButton
          label="Last page"
          disabled={page >= safeTotalPages || disabled}
          onClick={() => onPageChange(safeTotalPages)}
        >
          <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          <ChevronLeftIcon className="-ml-2 h-4 w-4 rotate-180" />
        </PagerButton>
      </div>
    </div>
  );
};

export default ServerPaginationFooter;
