import { useTranslation } from "react-i18next";
import DateField from "@/components/common/form/input/DateField";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import {
  booleanLabels,
  isEnterable,
  type ComponentSpec
} from "./componentValue";
import { usePickListOptions } from "./usePickListOptions";

const inputClasses =
  "h-9 w-full rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

interface ComponentValueEditorProps {
  spec: ComponentSpec;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible name — a grid cell has no visible label of its own. */
  label?: string;
}

/** The one input for a result value: number, pick-list answer, yes/no, text or date, chosen by
 * the component's type. Calculated and description-only components are shown, not edited. */
const ComponentValueEditor = ({
  spec,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  label
}: ComponentValueEditorProps) => {
  const { t } = useTranslation();
  const listOptions = usePickListOptions(
    spec.type === "LIST" ? spec.list : null
  );

  if (!isEnterable(spec.type))
    return (
      <span className="truncate text-sm text-gray-500" title={value}>
        {value || "—"}
      </span>
    );

  switch (spec.type) {
    case "LIST":
      return (
        <SelectDropdown
          options={[{ value: "", label: "—" }, ...listOptions]}
          value={value}
          onChange={onChange}
          placeholder={t("limsPickAnswer")}
          ariaLabel={label}
          disabled={disabled}
          portal
        />
      );
    case "BOOLEAN": {
      const { yes, no } = booleanLabels(spec.option);
      return (
        <SelectDropdown
          options={[
            { value: "", label: "—" },
            { value: "true", label: yes },
            { value: "false", label: no }
          ]}
          value={value}
          onChange={onChange}
          placeholder={t("limsPickAnswer")}
          ariaLabel={label}
          disabled={disabled}
          portal
        />
      );
    }
    case "DATETIME":
      return (
        <DateField
          mode="date"
          value={value}
          onChange={(next) => onChange(next ?? "")}
          disabled={disabled}
        />
      );
    case "TEXT":
      return (
        <input
          aria-label={label}
          className={inputClasses}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return (
        <div className="flex items-center gap-1.5">
          <input
            aria-label={label}
            inputMode="decimal"
            className={inputClasses}
            value={value}
            autoFocus={autoFocus}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
          {spec.unit ? (
            <span className="shrink-0 text-xs text-gray-500">{spec.unit}</span>
          ) : null}
        </div>
      );
  }
};

export default ComponentValueEditor;
