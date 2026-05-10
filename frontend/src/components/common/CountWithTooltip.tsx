import {
  CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { ChipList } from "@/components/common/form/chipList";
export type TooltipPlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";
export type TooltipPlacementInput = TooltipPlacement | "right" | "left";

interface CountWithTooltipProps {
  count: number;
  items: string[];
  buttonLabel?: string;
  headerLabel?: string;
  subLabel?: string;
  placement?: TooltipPlacementInput;
  className?: string;
  stopPropagation?: boolean;
  portal?: boolean;
}

const CountWithTooltip = ({
  count,
  items,
  buttonLabel,
  headerLabel,
  subLabel,
  placement = "bottom-right",
  className,
  stopPropagation = true,
  portal = false
}: CountWithTooltipProps) => {
  const tooltipId = useId();
  const closeTimerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>();

  const label = buttonLabel ?? `+${count}`;
  const header = headerLabel ?? `Selected (${count} more)`;
  const sub = subLabel ?? "Scroll to view";

  const normalizedPlacement: TooltipPlacement =
    placement === "right"
      ? "bottom-right"
      : placement === "left"
        ? "bottom-left"
        : placement;

  const tooltipPositionClasses: Record<TooltipPlacement, string> = {
    "bottom-right": "absolute left-0 top-full mt-3",
    "bottom-left": "absolute right-0 top-full mt-3",
    "top-right": "absolute left-0 bottom-full mb-3",
    "top-left": "absolute right-0 bottom-full mb-3"
  };

  const arrowPositionClasses: Record<TooltipPlacement, string> = {
    "bottom-right": "absolute left-6 -top-[10px]",
    "bottom-left": "absolute right-6 -top-[10px]",
    "top-right": "absolute left-6 -bottom-[10px]",
    "top-left": "absolute right-6 -bottom-[10px]"
  };

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  }, [clearCloseTimer]);

  const updatePortalPosition = useCallback(() => {
    if (!portal || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 12;
    const opensBelow = normalizedPlacement.startsWith("bottom");
    const alignsLeft = normalizedPlacement.endsWith("right");

    const preferredLeft = alignsLeft
      ? triggerRect.left
      : triggerRect.right - tooltipRect.width;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - tooltipRect.width - viewportPadding
    );

    const preferredTop = opensBelow
      ? triggerRect.bottom + gap
      : triggerRect.top - tooltipRect.height - gap;
    const top = Math.min(
      Math.max(viewportPadding, preferredTop),
      window.innerHeight - tooltipRect.height - viewportPadding
    );

    setPortalStyle({
      left,
      position: "fixed",
      top
    });
  }, [normalizedPlacement, portal]);

  useLayoutEffect(() => {
    if (!isOpen || !portal) {
      return;
    }

    updatePortalPosition();
  }, [isOpen, portal, updatePortalPosition]);

  useEffect(() => {
    if (!isOpen || !portal) {
      return;
    }

    const handleViewportChange = () => updatePortalPosition();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, portal, updatePortalPosition]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer]
  );

  if (count <= 0) return null;

  const tooltip = isOpen ? (
    <div
      id={tooltipId}
      ref={tooltipRef}
      role="tooltip"
      className={[
        portal
          ? "fixed z-[1200]"
          : `${tooltipPositionClasses[normalizedPlacement]} z-50`,
        portal && !portalStyle ? "invisible" : ""
      ].join(" ")}
      style={portal ? portalStyle : undefined}
      onClick={(e) => stopPropagation && e.stopPropagation()}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
    >
      <div
        className={`${arrowPositionClasses[normalizedPlacement]} h-5 w-5 rotate-45 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm`}
      />
      <div
        className={`${arrowPositionClasses[normalizedPlacement]} pointer-events-none h-5 w-5 rotate-45 rounded-[6px] bg-transparent`}
      />

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

        <ChipList
          items={items}
          variant="grid"
          columns={3}
          maxHeightClassName="max-h-44"
        />
      </div>
    </div>
  ) : null;

  return (
    <div
      className={`relative shrink-0 ${className ?? ""}`.trim()}
      onMouseEnter={() => {
        clearCloseTimer();
        if (portal) setPortalStyle(undefined);
        setIsOpen(true);
      }}
      onMouseLeave={portal ? scheduleClose : () => setIsOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setIsOpen((prev) => {
            if (!prev && portal) setPortalStyle(undefined);
            return !prev;
          });
        }}
        onFocus={() => {
          if (portal) setPortalStyle(undefined);
          setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
      >
        {label}
      </button>

      {portal && tooltip && typeof document !== "undefined"
        ? createPortal(tooltip, document.body)
        : tooltip}
    </div>
  );
};

export default CountWithTooltip;
