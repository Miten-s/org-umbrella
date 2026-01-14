import { useId, useState } from "react";
import { ChipList } from "@/components/common/form/chipList";

interface CountWithTooltipProps {
  count: number;
  items: string[];
  buttonLabel?: string;
  headerLabel?: string;
  subLabel?: string;
  className?: string;
  stopPropagation?: boolean;
}

const CountWithTooltip = ({
  count,
  items,
  buttonLabel,
  headerLabel,
  subLabel,
  className,
  stopPropagation = true
}: CountWithTooltipProps) => {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (count <= 0) return null;

  const label = buttonLabel ?? `+${count}`;
  const header = headerLabel ?? `Selected (${count} more)`;
  const sub = subLabel ?? "Scroll to view";

  return (
    <div
      className={`relative   shrink-0 ${className ?? ""}`.trim()}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        {label}
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute right-0 top-full mt-3 z-50"
          onClick={(e) => stopPropagation && e.stopPropagation()}
        >
          <div className="absolute right-6 -top-[10px] h-5 w-5 rotate-45 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm" />
          <div className="pointer-events-none absolute right-6 -top-[10px] h-5 w-5 rotate-45 rounded-[6px] bg-transparent" />

          <div
            className={[
              "w-[480px] max-w-[85vw]",
              "rounded-2xl",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur",
              "border border-slate-200 dark:border-slate-700",
              "shadow-2xl shadow-slate-300/40 dark:shadow-black/40",
              "ring-1 ring-black/5 dark:ring-white/5",
              "p-3"
            ].join(" ")}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {header}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {sub}
              </div>
            </div>

            <ChipList items={items} variant="grid" columns={3} maxHeightClassName="max-h-44" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CountWithTooltip;
