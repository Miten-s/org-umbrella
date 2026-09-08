interface SwitchProps {
  label: string;
  checked?: boolean; // use checked instead of defaultChecked
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
}

const Switch: React.FC<SwitchProps> = ({
  label,
  checked = false,
  disabled = false,
  onChange,
  color = "blue"
}) => {
  const handleToggle = () => {
    if (disabled) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  const switchColors =
    color === "blue"
      ? {
          background: checked ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10",
          knob: checked ? "translate-x-full bg-white" : "translate-x-0 bg-white"
        }
      : {
          background: checked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10",
          knob: checked ? "translate-x-full bg-white" : "translate-x-0 bg-white"
        };

  return (
    <label
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      }}
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
      onClick={handleToggle}
    >
      <div className="relative">
        <div
          className={`block transition duration-150 ease-linear h-6 w-11 rounded-full ${switchColors.background} ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
        ></div>
      </div>
      {label}
    </label>
  );
};

export default Switch;
