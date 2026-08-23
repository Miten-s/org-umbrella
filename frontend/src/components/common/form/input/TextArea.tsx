import React from "react";
import { useTranslation } from "react-i18next";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
  /**
   * Blocks typing without the muted `disabled` look, and — unlike
   * `disabled`, which browsers also make non-resizable — keeps the native
   * drag-to-resize handle live. For read-only display (e.g. an audit trail
   * value) where the viewer should still be able to make it bigger.
   */
  readOnly?: boolean;
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  readOnly = false
}) => {
  const { t } = useTranslation();
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `block w-full max-w-full  overflow-x-hidden rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className} `;

  if (disabled) {
    // `opacity-50` faded real saved text as much as an empty placeholder —
    // same fix as InputField.tsx — so a populated read-only textarea (a
    // Description/Notes field in View mode) was indistinguishable from an
    // empty one at a glance.
    textareaClasses += ` bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent  border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 text-gray-900 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative min-w-0">
      <textarea
        placeholder={placeholder || t("form.enterMessage")}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
