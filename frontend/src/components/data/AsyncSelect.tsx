import { ChevronDownIcon, CloseLineIcon, PlusIcon } from "@/public/icons";
import type { AsyncOption } from "@/lib/query/listTypes";
import type { UseAsyncOptionsParams } from "@/hooks/useAsyncOptions";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CSSProperties,
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

type OptionsHookArgs = Pick<
  UseAsyncOptionsParams,
  "search" | "enabled" | "selectedValues"
>;

interface AsyncSelectBaseProps {
  /**
   * A bound `useAsyncOptions` hook for this entity. The module supplies it so
   * AsyncSelect stays entity-agnostic. Must be a hook (called every render).
   */
  useOptions: (args: OptionsHookArgs) => ReturnType<typeof useAsyncOptions>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /**
   * Known labels for the currently-selected value(s), typically taken from the
   * record being edited (e.g. a user's nested `designation: { id, name }`).
   * Seeds the label cache so the trigger shows the right label immediately even
   * when the value sits deep in the dataset and isn't on the first loaded page —
   * without needing a resolve-by-id endpoint. See STANDARDS.md §5.
   */
  initialSelectedOptions?: AsyncOption[];
  /** px height of each option row (virtualization estimate). */
  optionHeight?: number;
  /** max px height of the scroll viewport. */
  listMaxHeight?: number;
  emptyLabel?: string;
  /** Tooltip placement for the "+N" overflow chip (multi only). */
  countTooltipPlacement?: TooltipPlacementInput;
}

interface SingleProps extends AsyncSelectBaseProps {
  multi?: false;
  value?: string;
  onChange: (value: string) => void;
  /**
   * Optional, additive: fires alongside `onChange` with the full selected
   * `{ value, label }` (or null when cleared). Lets consumers persist the label
   * (e.g. `{ userId, name }`) without a separate lookup. Existing consumers that
   * only use `onChange` are unaffected.
   */
  onChangeOption?: (option: AsyncOption | null) => void;
}

interface MultiProps extends AsyncSelectBaseProps {
  multi: true;
  value?: string[];
  onChange: (value: string[]) => void;
  /** Optional, additive: fires alongside `onChange` with the full selected options. */
  onChangeOptions?: (options: AsyncOption[]) => void;
  /**
   * Allow creating a new option by typing: when the search text matches no
   * existing option, an "Add …" row appears; picking it adds the typed string
   * as a value. The backend resolves such non-id strings by name (create-on-
   * demand). Multi-select only.
   */
  allowCreate?: boolean;
  /** Custom label for the create row (default: `Add "<text>"`). */
  createLabel?: (text: string) => string;
}

export type AsyncSelectProps = SingleProps | MultiProps;

const ROW_OVERSCAN = 6;

/**
 * Server-driven, virtualized, typeahead select — see STANDARDS.md §5.
 * Never loads all options; resolves selected value labels by id when editing.
 */
export const AsyncSelect = (props: AsyncSelectProps) => {
  const {
    useOptions,
    placeholder = "Select…",
    disabled = false,
    error = false,
    initialSelectedOptions,
    optionHeight = 40,
    listMaxHeight = 260,
    emptyLabel = "No results",
    countTooltipPlacement = "bottom-right"
  } = props;
  const isMulti = props.multi === true;

  const selectedValues = useMemo<string[]>(() => {
    if (isMulti) return (props.value as string[]) ?? [];
    return props.value ? [props.value as string] : [];
  }, [isMulti, props.value]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();

  // Focus the search box WITHOUT scrolling. `autoFocus` (and a plain .focus())
  // scroll-into-view the input, which jerks the page/modal behind the portaled
  // menu — the "background flicker/movement" when a dropdown opens.
  useEffect(() => {
    if (open) searchInputRef.current?.focus({ preventScroll: true });
  }, [open]);

  const {
    options,
    resolvedSelected,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useOptions({ search, enabled: open, selectedValues });

  // Persist resolved labels across searches so the trigger keeps showing them
  // even after the loaded pages change (e.g. the user types a new query).
  const labelCache = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    [
      ...(initialSelectedOptions ?? []),
      ...options,
      ...resolvedSelected
    ].forEach((o) => labelCache.current.set(o.value, o.label));
  }, [initialSelectedOptions, options, resolvedSelected]);

  // Resolve a value's label SYNCHRONOUSLY during render so the seeded label
  // (from the edited record) shows immediately, before any fetch — falling back
  // to loaded pages, resolve-by-id, the persisted cache, then the raw value.
  const labelFor = useCallback(
    (value: string) =>
      initialSelectedOptions?.find((o) => o.value === value)?.label ??
      options.find((o) => o.value === value)?.label ??
      resolvedSelected.find((o) => o.value === value)?.label ??
      labelCache.current.get(value) ??
      value,
    [initialSelectedOptions, options, resolvedSelected]
  );

  // --- multi chip overflow: collapse chips past the field width into a "+N"
  // count (same behaviour as the shared MultiSelect used by other modals). ---
  const selectedLabels = useMemo(
    () => selectedValues.map((v) => ({ value: v, label: labelFor(v) })),
    [selectedValues, labelFor]
  );
  const chipsAreaRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const measureTextPx = useCallback((text: string, font: string) => {
    if (!canvasRef.current)
      canvasRef.current = document.createElement("canvas");
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  }, []);
  useLayoutEffect(() => {
    if (!isMulti) return;
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
      const chipPaddingAndX = 44; // chip padding + close icon
      const chipGap = 6;
      let used = 0;
      let count = 0;
      for (let i = 0; i < selectedLabels.length; i++) {
        const w =
          measureTextPx(selectedLabels[i].label, font) + chipPaddingAndX;
        const next = count === 0 ? w : w + chipGap;
        if (used + next <= available) {
          used += next;
          count += 1;
        } else break;
      }
      setVisibleCount(Math.max(1, count));
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMulti, selectedLabels, measureTextPx]);
  const visibleSelected = selectedLabels.slice(0, visibleCount);
  const hiddenSelected = selectedLabels.slice(visibleCount);

  // --- open/close, outside click, positioning ---
  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    if (disabled && open) close();
  }, [disabled, open, close]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      // Both this and the parent Modal listen on `document`; without this the
      // Modal's own Escape handler fires right after and closes the whole
      // form, discarding everything typed — Escape should dismiss only the
      // open dropdown.
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pad = 16;
      const below = window.innerHeight - rect.bottom - pad;
      const above = rect.top - pad;
      const openAbove = below < listMaxHeight && above > below;
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: openAbove ? undefined : rect.bottom + 4,
        bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, listMaxHeight]);

  // --- virtualization ---
  // `getItemKey` defaults to raw array index, which tracks a *slot*, not an
  // *option* — when a search re-sorts/replaces the array, a row's cached
  // position can be silently reused for a different option at the same
  // index while a stale-vs-current render is still settling, which is
  // exactly how a click can commit a different record than the one visibly
  // labeled at that position. Keying by the option's own value ties each
  // rendered slot to a stable identity instead of a position.
  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => optionHeight,
    overscan: ROW_OVERSCAN,
    getItemKey: (index) => options[index]?.value ?? index
  });

  // Infinite scroll: fetch next page as the last virtual rows come into view.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (
      last.index >= options.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    virtualItems,
    options.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  ]);

  const isSelected = useCallback(
    (value: string) => selectedValues.includes(value),
    [selectedValues]
  );

  const handlePick = useCallback(
    (option: AsyncOption) => {
      if (option.disabled) return;
      if (isMulti) {
        const set = new Set(selectedValues);
        if (set.has(option.value)) set.delete(option.value);
        else set.add(option.value);
        const next = [...set];
        (props.onChange as (v: string[]) => void)(next);
        (props as MultiProps).onChangeOptions?.(
          next.map((v) => ({ value: v, label: labelFor(v) }))
        );
      } else {
        (props.onChange as (v: string) => void)(option.value);
        (props as SingleProps).onChangeOption?.(option);
        close();
      }
    },
    [isMulti, selectedValues, props, close, labelFor]
  );

  // Create-on-demand: add the typed search string as a new value. The backend
  // treats non-id strings as names and find-or-creates them.
  const handleCreate = useCallback(() => {
    const raw = search.trim();
    if (!raw || !isMulti || selectedValues.includes(raw)) return;
    const next = [...selectedValues, raw];
    (props.onChange as (v: string[]) => void)(next);
    (props as MultiProps).onChangeOptions?.(
      next.map((v) => ({ value: v, label: labelFor(v) }))
    );
    labelCache.current.set(raw, raw);
    setSearch("");
  }, [search, isMulti, selectedValues, props, labelFor]);

  const removeValue = useCallback(
    (value: string) => {
      if (isMulti) {
        const next = selectedValues.filter((v) => v !== value);
        (props.onChange as (v: string[]) => void)(next);
        (props as MultiProps).onChangeOptions?.(
          next.map((v) => ({ value: v, label: labelFor(v) }))
        );
      } else {
        (props.onChange as (v: string) => void)("");
        (props as SingleProps).onChangeOption?.(null);
      }
    },
    [isMulti, selectedValues, props, labelFor]
  );

  const showEmpty = !isLoading && options.length === 0;

  // Whether to offer an "Add …" row for the current search text.
  const trimmedSearch = search.trim();
  const canCreate =
    isMulti &&
    (props as MultiProps).allowCreate === true &&
    trimmedSearch.length > 0 &&
    !options.some(
      (o) => o.label.trim().toLowerCase() === trimmedSearch.toLowerCase()
    ) &&
    !selectedValues.some(
      (v) =>
        v.trim().toLowerCase() === trimmedSearch.toLowerCase() ||
        labelFor(v).trim().toLowerCase() === trimmedSearch.toLowerCase()
    );
  const createLabel =
    (props as MultiProps).createLabel?.(trimmedSearch) ??
    `Add "${trimmedSearch}"`;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={[
          "flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left dark:bg-gray-800 dark:text-gray-100",
          error
            ? "border-error-400 dark:border-error-600"
            : "border-gray-300 dark:border-gray-700",
          disabled ? "cursor-not-allowed opacity-60" : ""
        ].join(" ")}
      >
        <span
          ref={chipsAreaRef}
          className="flex min-w-0 flex-auto flex-nowrap items-center gap-1.5 overflow-hidden"
        >
          {selectedValues.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : isMulti ? (
            <>
              {visibleSelected.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                >
                  <span className="truncate">{opt.label}</span>
                  {!disabled && (
                    <CloseLineIcon
                      className="h-3.5 w-3.5 shrink-0 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeValue(opt.value);
                      }}
                    />
                  )}
                </span>
              ))}
              {hiddenSelected.length > 0 && (
                <CountWithTooltip
                  count={hiddenSelected.length}
                  items={hiddenSelected.map((x) => x.label)}
                  headerLabel={`Selected (${hiddenSelected.length} more)`}
                  stopPropagation
                  placement={countTooltipPlacement}
                  portal
                />
              )}
            </>
          ) : (
            <span className="inline-flex min-w-0 max-w-full items-center rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100">
              <span className="truncate">{labelFor(selectedValues[0])}</span>
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-[9999] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCreate) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="Search…"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {canCreate ? (
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-gray-800 dark:text-brand-300 dark:hover:bg-brand-500/10"
              >
                <PlusIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{createLabel}</span>
              </button>
            ) : null}

            <div
              ref={scrollRef}
              className="overflow-auto"
              style={{ maxHeight: listMaxHeight }}
            >
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                  Loading…
                </div>
              ) : showEmpty ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                  {emptyLabel}
                </div>
              ) : (
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    position: "relative",
                    width: "100%"
                  }}
                >
                  {virtualItems.map((vi) => {
                    const option = options[vi.index];
                    if (!option) return null;
                    const active = isSelected(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePick(option)}
                        disabled={option.disabled}
                        className={[
                          "absolute left-0 top-0 flex w-full flex-col items-start justify-center px-3 text-left text-sm transition-colors",
                          active
                            ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                            : "text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800",
                          option.disabled ? "cursor-not-allowed opacity-50" : ""
                        ].join(" ")}
                        style={{
                          height: vi.size,
                          transform: `translateY(${vi.start}px)`
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        {option.sublabel ? (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {option.sublabel}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {isFetchingNextPage ? (
                <div className="px-4 py-2 text-center text-xs text-gray-400">
                  Loading more…
                </div>
              ) : null}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AsyncSelect;
