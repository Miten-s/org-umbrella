import { memo } from "react";

type StatusTone = "success" | "error" | "warning" | "neutral";

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  center?: boolean;
}

const toneClasses: Record<StatusTone, string> = {
  success:
    "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300",
  error: "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300",
  warning:
    "bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

/** Status pill (active/inactive/enabled…). Replaces the repeated status cell. */
export const StatusPill = memo(
  ({ label, tone = "neutral", center = true }: StatusPillProps) => (
    <div className={`flex w-full py-1.5 ${center ? "justify-center" : ""}`}>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
      >
        {label}
      </span>
    </div>
  )
);

StatusPill.displayName = "StatusPill";

/** Common helper: map an active/disabled status to a pill tone. */
// eslint-disable-next-line react-refresh/only-export-components
export const statusTone = (isActive: boolean): StatusTone =>
  isActive ? "success" : "error";

export default StatusPill;
