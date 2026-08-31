import Button from "@/components/ui/button/Button";
import type { ReactNode } from "react";

/** Shared non-functional states (STANDARDS.md §9): loading/empty/error, reused by
 * DataTable and (compact variants) inside dropdowns. */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Shimmer skeleton for first-load. On refetch, keep old rows instead. */
export const TableSkeleton = ({ rows = 6, columns = 4 }: TableSkeletonProps) => (
  <div
    className="w-full animate-pulse space-y-3 p-4"
    role="status"
    aria-label="Loading"
  >
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700"
            style={{ maxWidth: colIndex === 0 ? "18rem" : undefined }}
          />
        ))}
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({
  title = "Nothing here yet",
  message,
  icon,
  action
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    {icon ? <div className="text-gray-300 dark:text-gray-600">{icon}</div> : null}
    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
    {message ? (
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
    ) : null}
    {action ? (
      <Button size="sm" variant="primary" onClick={action.onClick} className="mt-2">
        {action.label}
      </Button>
    ) : null}
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  message = "Something went wrong.",
  onRetry
}: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <p className="max-w-sm text-sm text-error-600 dark:text-error-300">{message}</p>
    {onRetry ? (
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </div>
);
