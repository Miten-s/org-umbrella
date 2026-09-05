import Switch from "@/components/common/form/switch/Switch";
import { memo } from "react";

interface StatusToggleCellProps {
  checked: boolean;
  label: string;
  /** Disable the toggle (another status mutation is in flight). */
  disabled?: boolean;
  /** THIS row's status mutation is in flight — show an inline spinner (S2). */
  loading?: boolean;
  onChange: () => void;
}

/**
 * Shared status-toggle cell: an enable/disable Switch that shows a small
 * spinner alongside it while its own mutation is pending. The Switch itself
 * stays mounted the whole time (never swapped for the spinner) — that swap
 * was what killed the slide transition: unmounting/remounting the knob makes
 * it snap straight to its final position instead of animating there, which
 * reads as a flicker. Since the toggle mutations flip `checked` optimistically
 * (before the request settles), the Switch can animate immediately either way.
 */
export const StatusToggleCell = memo(
  ({ checked, label, disabled, loading, onChange }: StatusToggleCellProps) => (
    <div className="flex items-center gap-2 py-1.5">
      <Switch label={label} checked={checked} disabled={disabled || loading} onChange={onChange} />
      {loading && (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-600 dark:border-t-brand-400"
          role="status"
          aria-label="Updating"
        />
      )}
    </div>
  )
);

StatusToggleCell.displayName = "StatusToggleCell";
export default StatusToggleCell;
