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
 * Shared status-toggle cell: an enable/disable Switch that swaps to an inline
 * spinner while its own mutation is pending, so users see the action in
 * progress (not just a disabled control). Used by every module with a toggle.
 */
export const StatusToggleCell = memo(
  ({ checked, label, disabled, loading, onChange }: StatusToggleCellProps) => (
    <div className="flex items-center py-1.5">
      {loading ? (
        <span
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
          role="status"
          aria-label="Updating"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-600 dark:border-t-brand-400" />
          {label}
        </span>
      ) : (
        <Switch label={label} checked={checked} disabled={disabled} onChange={onChange} />
      )}
    </div>
  )
);

StatusToggleCell.displayName = "StatusToggleCell";
export default StatusToggleCell;
