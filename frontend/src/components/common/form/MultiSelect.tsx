import Button from "@/components/ui/button/Button";
import { t } from "i18next";
import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import CountWithTooltip, {
  type TooltipPlacementInput
} from "@/components/common/CountWithTooltip";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  showAddButton?: boolean;
  onAdd?: (newOption: Option) => void;
  error?: string;
  hint?: string;
  countTooltipPlacement?: TooltipPlacementInput;
  portal?: boolean;
  dropdownMaxHeight?: number;
  listMaxHeight?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  showAddButton = false,
  onAdd,
  error,
  hint,
  countTooltipPlacement,
  portal = false,
  dropdownMaxHeight = 250,
  listMaxHeight = 160
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const chipsAreaRef = useRef<HTMLDivElement | null>(null);
  const caretRef = useRef<HTMLDivElement | null>(null);

  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [newOptionText, setNewOptionText] = useState("");
  const [internalOptions, setInternalOptions] = useState<Option[]>(options);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>();

  const [visibleCount, setVisibleCount] = useState<number>(0);

  // Keep options in sync
  useEffect(() => {
    setInternalOptions(options);
  }, [options]);

  // Keep default selected in sync
  useEffect(() => {
    setSelectedOptions(defaultSelected);
  }, [defaultSelected]);

  // Close dropdown on outside click / escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const target = event.target as Node;
      const isInsideTrigger = containerRef.current.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  useEffect(() => {
    if (!portal || !isOpen) {
      setPortalStyle(undefined);
      return;
    }

    const updatePortalPosition = () => {
      const triggerRect = inputRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 16;
      const availableBelow =
        window.innerHeight - triggerRect.bottom - viewportPadding;
      const availableAbove = triggerRect.top - viewportPadding;
      const openAbove =
        availableBelow < dropdownMaxHeight && availableAbove > availableBelow;
      const maxHeight = Math.min(
        dropdownMaxHeight,
        Math.max(openAbove ? availableAbove : availableBelow, 160)
      );

      setPortalStyle({
        left: triggerRect.left,
        maxHeight,
        top: openAbove ? undefined : triggerRect.bottom + 8,
        bottom: openAbove
          ? window.innerHeight - triggerRect.top + 8
          : undefined,
        width: triggerRect.width
      });
    };

    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [dropdownMaxHeight, isOpen, portal]);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (value: string) => {
      setSelectedOptions((prev) => {
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];

        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const removeOption = useCallback(
    (value: string) => {
      setSelectedOptions((prev) => {
        const next = prev.filter((v) => v !== value);
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const handleAddNewOption = useCallback(() => {
    const rawText = newOptionText;
    if (!rawText.trim()) return;

    const newOption: Option = {
      value: rawText,
      text: rawText
    };

    setInternalOptions((prev) => [...prev, newOption]);
    handleSelect(newOption.value);
    onAdd?.(newOption);
    setNewOptionText("");
  }, [handleSelect, newOptionText, onAdd]);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return internalOptions;
    return internalOptions.filter((opt) =>
      opt.text.toLowerCase().includes(term)
    );
  }, [internalOptions, searchTerm]);

  const selectedLabels = useMemo(() => {
    const map = new Map(internalOptions.map((o) => [o.value, o.text]));
    return selectedOptions.map((val) => ({
      value: val,
      text: map.get(val) ?? val
    }));
  }, [selectedOptions, internalOptions]);
  
  // Canvas measurement (fast, accurate for font)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const measureTextPx = useCallback((text: string, font: string) => {
    if (!canvasRef.current)
      canvasRef.current = document.createElement("canvas");
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  }, []);

  /**
   * Compute how many chips can fit into the chips area.
   * - Accounts for chip text width + padding + close button
   * - Accounts for gaps between chips
   * - Accounts for the dynamic width of the "+X" chip when there are hidden items
   */
  useLayoutEffect(() => {
    const el = chipsAreaRef.current;
    if (!el) return;

    const compute = () => {
      const available = el.clientWidth;

      if (selectedLabels.length === 0 || available <= 0) {
        setVisibleCount(0);
        return;
      }

      const style = window.getComputedStyle(el);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      // tune once for your chip styling
      const chipPaddingAndX = 44; // padding + close icon area
      const chipGap = 6;

      let used = 0;
      let count = 0;

      for (let i = 0; i < selectedLabels.length; i++) {
        const w = measureTextPx(selectedLabels[i].text, font) + chipPaddingAndX;
        const next = count === 0 ? w : w + chipGap;

        if (used + next <= available) {
          used += next;
          count += 1;
        } else {
          break;
        }
      }

      setVisibleCount(Math.max(1, count));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);

    return () => ro.disconnect();
  }, [selectedLabels, measureTextPx]);

  const visibleSelected = selectedLabels.slice(0, visibleCount);
  const hiddenSelected = selectedLabels.slice(visibleCount);

  const hiddenCount = hiddenSelected.length;
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={[
        portal ? "fixed" : "absolute left-0 top-full",
        "z-[1200] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      ].join(" ")}
      style={portal ? portalStyle : { maxHeight: dropdownMaxHeight }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {internalOptions.length > 0 && (
        <div className="border-b border-gray-200 p-2 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md border p-2 text-sm outline-hidden dark:bg-gray-800 dark:text-white/90"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            autoFocus
          />
        </div>
      )}

      <div
        className={[
          "flex flex-col overflow-y-auto overscroll-contain scroll-smooth no-scrollbar",
          showAddButton ? "pb-10" : ""
        ].join(" ")}
        style={{ maxHeight: listMaxHeight }}
      >
        {filteredOptions.length === 0 ? (
          <div className="p-2 text-center text-gray-500 dark:text-white/70">
            No data found
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <div
                key={option.value}
                className="w-full cursor-pointer border-b border-gray-200 hover:bg-gray-100 last:border-b-0 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={[
                    "flex items-center p-2 pl-2",
                    isSelected ? "bg-primary/10" : ""
                  ].join(" ")}
                >
                  <div className="mx-2 leading-6 text-gray-800 dark:text-white/90">
                    {option.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddButton && (
        <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <input
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            placeholder="Add new..."
            className="flex-1 rounded-md border p-3 text-sm outline-hidden dark:bg-gray-800 dark:text-white/90"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleAddNewOption();
              }
            }}
          />
          <Button type="button" variant="primary" onClick={handleAddNewOption}>
            {t("add")}
          </Button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            className="w-full"
          >
            <div
              ref={inputRef}
              className={[
                "mb-2 flex h-11 rounded-lg border py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition",
                "border-gray-300 focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                error
                  ? "border-red-500 focus:border-red-500 focus:shadow-none"
                  : ""
              ].join(" ")}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDropdown();
                }
              }}
              aria-expanded={isOpen}
              aria-disabled={disabled}
            >
              {/* Chips area */}
              <div
                ref={chipsAreaRef}
                className="flex flex-nowrap items-center flex-auto min-w-0 overflow-visible gap-1.5"
              >
                {selectedOptions.length > 0 ? (
                  <>
                    {visibleSelected.map((opt) => (
                      <div
                        key={opt.value}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 min-w-0"
                      >
                        <span className="truncate text-sm">{opt.text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (disabled) return;
                            removeOption(opt.value);
                          }}
                          disabled={disabled}
                          className={[
                            "shrink-0 leading-none",
                            disabled
                              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          ].join(" ")}
                          aria-label="Remove selected option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {hiddenCount > 0 && (
                      <CountWithTooltip
                        count={hiddenCount}
                        items={hiddenSelected.map((x) => x.text)}
                        headerLabel={`Selected (${hiddenCount} more)`}
                        stopPropagation={true}
                        placement={countTooltipPlacement}
                        portal
                      />
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Select option</span>
                )}
              </div>

              {/* Caret */}
              <div
                ref={caretRef}
                className="flex items-center py-1 pl-1 pr-1 w-7 shrink-0"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  className="w-5 h-5 text-gray-700 dark:text-gray-400"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <svg
                    className={`stroke-current transform transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Dropdown */}
          {portal && dropdownContent && typeof document !== "undefined"
            ? createPortal(dropdownContent, document.body)
            : dropdownContent}
        </div>
      </div>

      {(error || hint) && (
        <p
          className={`mt-1 text-xs ${error ? "text-red-500" : "text-gray-500"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default MultiSelect;
