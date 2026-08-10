import { memo } from "react";

const initialsOf = (value: string, fallback = "?") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || fallback;

interface AvatarCellProps {
  /** Primary text — also the initials source. */
  label: string;
  /** Optional secondary line (e.g. email). */
  sublabel?: string;
  /** Fallback letter when label is empty. */
  fallbackInitial?: string;
  size?: "sm" | "md";
  /** Show the initials avatar circle. Opt-in — only the Users tables use it. */
  showAvatar?: boolean;
}

/** Primary/secondary text, with an optional initials avatar (Users tables only). */
export const AvatarCell = memo(
  ({
    label,
    sublabel,
    fallbackInitial = "?",
    size = "md",
    showAvatar = false
  }: AvatarCellProps) => {
    const dimension = size === "sm" ? "h-9 w-9" : "h-10 w-10";
    return (
      <div className="flex items-center gap-3 py-1.5">
        {showAvatar && (
          <div
            className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200`}
          >
            {initialsOf(label, fallbackInitial)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {label}
          </div>
          {sublabel ? (
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {sublabel}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

AvatarCell.displayName = "AvatarCell";
export default AvatarCell;
