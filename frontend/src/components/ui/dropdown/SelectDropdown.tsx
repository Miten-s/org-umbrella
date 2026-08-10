import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "./Dropdown";
import { DropdownItem } from "./DropdownItem";
import { ChevronDownIcon } from "@/public/icons";

interface SelectDropdownProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  portal?: boolean;
  dropdownMaxHeight?: number;
  listMaxHeight?: number;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  portal = false,
  dropdownMaxHeight = 250,
  listMaxHeight = 180
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [portalStyle, setPortalStyle] = useState<CSSProperties>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  useEffect(() => {
    if (!portal || !open) {
      setPortalStyle(undefined);
      return;
    }

    const updatePortalPosition = () => {
      const triggerRect = dropdownRef.current?.getBoundingClientRect();
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
        top: openAbove ? undefined : triggerRect.bottom,
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
  }, [dropdownMaxHeight, open, portal]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        className={[
          "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-left dark:text-gray-100 flex justify-between items-center min-h-[42px]",
          disabled ? "cursor-not-allowed opacity-60" : ""
        ].join(" ")}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
      >
        <span className="flex flex-wrap gap-2 items-center">
          {selectedOption ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {!disabled && (
        <Dropdown
          isOpen={open}
          onClose={() => setOpen(false)}
          className="w-full overflow-hidden"
          position={portal ? "fixed" : "absolute"}
          portal={portal}
          style={portal ? portalStyle : { maxHeight: dropdownMaxHeight }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {options.length > 0 && (
            <div className="px-3 pb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none"
              />
            </div>
          )}

          <div className="overflow-auto" style={{ maxHeight: listMaxHeight }}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                No data found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <DropdownItem
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`${
                    value === opt.value
                      ? "bg-gray-100 dark:bg-gray-700 font-medium"
                      : ""
                  }`}
                >
                  {opt.label}
                </DropdownItem>
              ))
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
};
