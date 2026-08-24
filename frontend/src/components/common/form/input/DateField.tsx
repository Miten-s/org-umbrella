import { useCallback, useEffect, useState, type FC } from "react";
import DatePicker, { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { ChevronLeftIcon } from "@/public/icons";

// Plain "YYYY-MM-DD"/"HH:mm" strings need the format hint below, or dayjs
// falls back to native Date parsing and mis-reads them (UTC day-shift, invalid time).
dayjs.extend(customParseFormat);

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
].map((label, index) => ({ label, value: String(index) }));

/** A fixed, generous range rather than "current year ± N" — keeps the list stable. */
const YEAR_OPTIONS = Array.from({ length: 2100 - 1950 + 1 }, (_, i) => {
  const year = 1950 + i;
  return { label: String(year), value: String(year) };
});

/** `value` stays pinned to native <input type="date"/"time"> formats so the payload is
 * unchanged; `display`/`placeholder` are just what the user sees. A future UTC/timezone
 * conversion would hook in right where `parsed`/`onChange` touch dayjs below. */
const FORMATS = {
  date: { value: "YYYY-MM-DD", display: "dd/MM/yyyy", placeholder: "dd/mm/yyyy" },
  time: { value: "HH:mm", display: "HH:mm", placeholder: "hh:mm" }
} as const;

interface DateFieldProps {
  mode?: keyof typeof FORMATS;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const DateField: FC<DateFieldProps> = ({
  mode = "date",
  value,
  onChange,
  onBlur,
  name,
  disabled = false,
  error = false,
  hint,
  className = ""
}) => {
  const fmt = FORMATS[mode];
  const parsed = value ? dayjs(value, fmt.value) : null;
  const selected = parsed?.isValid() ? parsed.toDate() : null;

  // react-datepicker's own Escape handling (if any) doesn't stop the event
  // from also reaching the parent Modal's `document`-level Escape listener,
  // which then closes the whole form and discards everything entered.
  // Mirrors AsyncSelect's/MultiSelect's fix — intercept and stop it
  // ourselves while the calendar is open.
  const [calendarOpen, setCalendarOpen] = useState(false);
  useEffect(() => {
    if (!calendarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.stopImmediatePropagation();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [calendarOpen]);
  const handleCalendarOpen = useCallback(() => setCalendarOpen(true), []);
  const handleCalendarClose = useCallback(() => {
    setCalendarOpen(false);
    onBlur?.();
  }, [onBlur]);

  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    // Same fix as InputField.tsx/TextArea.tsx: `opacity-40` faded a real
    // saved date as much as an empty field, so it read as blank in View
    // mode even when populated.
    inputClasses += ` text-gray-700 border-gray-300 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700`;
  } else if (error) {
    inputClasses += `  border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <DatePicker
        name={name}
        selected={selected}
        onChange={(date: Date | null) => onChange?.(date ? dayjs(date).format(fmt.value) : "")}
        onCalendarOpen={handleCalendarOpen}
        onCalendarClose={handleCalendarClose}
        disabled={disabled}
        dateFormat={fmt.display}
        placeholderText={fmt.placeholder}
        className={inputClasses}
        autoComplete="off"
        // Renders the popup to a shared body-level node instead of inline where the
        // input sits — otherwise a grid cell's own overflow-x-auto wrapper (forced to
        // also clip vertically, per the CSS overflow spec) cuts the calendar off.
        portalId="date-field-portal"
        showTimeSelect={mode === "time"}
        showTimeSelectOnly={mode === "time"}
        timeFormat={mode === "time" ? "HH:mm" : undefined}
        timeIntervals={mode === "time" ? 15 : undefined}
        timeCaption={mode === "time" ? "Time" : undefined}
        renderCustomHeader={
          mode === "date"
            ? ({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }: ReactDatePickerCustomHeaderProps) => (
                <div className="flex items-center justify-center gap-1.5 px-2 pb-2">
                  <button
                    type="button"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    aria-label="Previous month"
                    className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="w-28">
                    <SelectDropdown
                      options={MONTH_OPTIONS}
                      value={String(date.getMonth())}
                      onChange={(v) => changeMonth(Number(v))}
                      placeholder=""
                      portal
                      ariaLabel="Month"
                    />
                  </div>
                  <div className="w-24">
                    <SelectDropdown
                      options={YEAR_OPTIONS}
                      value={String(date.getFullYear())}
                      onChange={(v) => changeYear(Number(v))}
                      placeholder=""
                      portal
                      ariaLabel="Year"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    aria-label="Next month"
                    className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    <ChevronLeftIcon className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              )
            : undefined
        }
      />
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>{hint}</p>
      )}
    </div>
  );
};

export default DateField;
