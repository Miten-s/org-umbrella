import { memo } from "react";

interface TruncateCellProps {
  value?: string | null;
  fallback?: string;
  muted?: boolean;
}

/** Single-line truncated text with a `-` fallback. Replaces the repeated text cell. */
export const TruncateCell = memo(
  ({ value, fallback = "-", muted = true }: TruncateCellProps) => (
    <div
      className={`truncate py-1.5 text-sm ${
        muted ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-white"
      }`}
      title={value || undefined}
    >
      {value || fallback}
    </div>
  )
);

TruncateCell.displayName = "TruncateCell";
export default TruncateCell;
