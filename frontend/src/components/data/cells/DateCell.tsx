import { memo } from "react";

/**
 * A date-only value (`enteredOn`, `expiryDate`, …) is stored as a
 * TIMESTAMPTZ column and always arrives as UTC midnight for that calendar
 * day (e.g. "2026-08-31T00:00:00.000Z"). Reading it back with LOCAL getters
 * (or `dayjs(...).format(...)`, which formats in local time) shifts it a
 * day in any timezone behind UTC — reading the UTC getters directly is what
 * keeps the day the user actually entered.
 */
const formatDateOnly = (value?: string | Date | null): string | null => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getUTCFullYear()}`;
};

interface DateCellProps {
  value?: string | Date | null;
  fallback?: string;
  muted?: boolean;
}

/** Grid date column — "31-08-2026" instead of the raw ISO string. */
export const DateCell = memo(
  ({ value, fallback = "-", muted = true }: DateCellProps) => {
    const formatted = formatDateOnly(value);
    return (
      <div
        className={`truncate py-1.5 text-sm ${
          muted ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-white"
        }`}
        title={formatted ?? undefined}
      >
        {formatted ?? fallback}
      </div>
    );
  }
);

DateCell.displayName = "DateCell";
export default DateCell;
