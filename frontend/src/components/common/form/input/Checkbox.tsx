import type React from "react";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  labelClassName?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  labelClassName = "",
  disabled = false
}) => {
  return (
    <label
      className={`group flex min-w-0 cursor-pointer items-start gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <div className="relative h-5 w-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className={`h-5 w-5 appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-brand-500 disabled:opacity-60 dark:border-gray-700 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          } ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />

        {checked && (
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="white"
              strokeWidth="1.94437"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {disabled && checked && (
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="#E4E7EC"
              strokeWidth="2.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {label && (
        <span
          className={`min-w-0 flex-1 break-words text-sm font-medium leading-5 text-gray-800 dark:text-gray-200 ${labelClassName}`}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;