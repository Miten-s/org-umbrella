import { CSSProperties, ReactNode, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

interface HelpTooltipProps {
  /** What the "?" explains — shown on hover or keyboard focus. */
  content: ReactNode;
  className?: string;
}

const TOOLTIP_WIDTH = 260;
const GAP = 8;

/** A small "?" icon that explains a field. Portalled + fixed so modal/grid overflow never clips it. */
const HelpTooltip = ({ content, className }: HelpTooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const open = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
      window.innerWidth - TOOLTIP_WIDTH - 8
    );
    // Above the icon, unless there's no room — then below it.
    const above = rect.top > 80;
    setStyle({
      position: "fixed",
      left,
      width: TOOLTIP_WIDTH,
      ...(above
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP })
    });
  };
  const close = () => setStyle(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="More information"
        aria-describedby={style ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={(event) => event.preventDefault()}
        className={twMerge(
          "ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-400 align-middle text-[10px] leading-none font-semibold text-gray-500 hover:border-brand-500 hover:text-brand-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-gray-500 dark:text-gray-400",
          className
        )}
      >
        ?
      </button>
      {style &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={style}
            className="pointer-events-none z-[100000] rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg dark:bg-gray-700"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default HelpTooltip;
