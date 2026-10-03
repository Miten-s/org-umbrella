import { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import Label from "@/components/common/form/Label";
import HelpTooltip from "@/components/common/HelpTooltip";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { PlusIcon, TrashBinIcon } from "@/public/icons";
import type { LimsComponentRow } from "./LimsAnalysis.types";
import {
  COMPONENT_TYPES,
  TYPE_LABELS,
  TYPE_SPECIFIC_KEYS,
  isLegacy,
  isTyped
} from "./componentTypes";

interface ComponentRowsEditorProps {
  rows: LimsComponentRow[];
  onChange: (rows: LimsComponentRow[]) => void;
  disabled?: boolean;
  error?: string;
}

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";

const typeOptions = COMPONENT_TYPES.map((value) => ({
  value,
  label: TYPE_LABELS[value]
}));

const str = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

/** One labelled cell of a component line; fixed width so every row lines up. */
const Cell = ({
  label,
  tooltip,
  width,
  children
}: {
  label: string;
  tooltip?: ReactNode;
  width: string;
  children: ReactNode;
}) => (
  <div className={`shrink-0 ${width}`}>
    {label && (
      <span className="mb-1 block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
        {label}
        {tooltip ? <HelpTooltip content={tooltip} /> : null}
      </span>
    )}
    {children}
  </div>
);

/** Test Template components — one line per component. The Type decides which inputs follow
 * it; changing the Type clears the old type's values so nothing stale is saved. */
const ComponentRowsEditor = ({
  rows,
  onChange,
  disabled = false,
  error
}: ComponentRowsEditorProps) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const patchRow = (index: number, patch: Partial<LimsComponentRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const changeType = (index: number, type: string) => {
    const cleared = Object.fromEntries(
      TYPE_SPECIFIC_KEYS.map((key) => [key, ""])
    );
    patchRow(index, { ...cleared, type });
  };

  const removeRow = (index: number) =>
    onChange(rows.filter((_, i) => i !== index));

  const addRow = () => {
    onChange([...rows, { componentId: "", name: "", description: "" }]);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const textCell = (
    row: LimsComponentRow,
    index: number,
    key: keyof LimsComponentRow & string,
    label: string,
    width: string,
    locked: boolean,
    extra?: { placeholder?: string; tooltip?: ReactNode; inputMode?: "decimal" }
  ) => (
    <Cell key={key} label={label} width={width} tooltip={extra?.tooltip}>
      <input
        aria-label={label}
        className={inputClasses}
        value={str(row[key])}
        placeholder={extra?.placeholder}
        inputMode={extra?.inputMode}
        disabled={disabled || locked}
        onChange={(event) => patchRow(index, { [key]: event.target.value })}
      />
    </Cell>
  );

  const legacySummary = (row: LimsComponentRow) =>
    [
      ["Type", row.type],
      ["Unit", row.unit],
      ["Calculation", row.calculation],
      ["Formula", row.formula],
      ["List", row.list],
      ["Option", row.option],
      ["Entity", row.entity],
      ["Criteria", row.entityCriteria],
      ["Min", row.min],
      ["Max", row.max]
    ]
      .filter(([, value]) => str(value).trim())
      .map(([key, value]) => `${key}: ${str(value)}`)
      .join(" · ");

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label className="mb-0">{t("limsComponents")}</Label>
        {!disabled ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            startIcon={<PlusIcon className="h-4 w-4" />}
            onClick={addRow}
          >
            {t("limsAddComponent")}
          </Button>
        ) : null}
      </div>

      {rows.length ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {rows.map((row, index) => {
              const legacy = isLegacy(row);
              return (
                <div key={row.id ?? `new-${index}`}>
                  {/* One line per component; scrolls sideways while delete button stays stuck on right */}
                  <div className="relative flex items-center">
                    <div className="flex flex-1 items-end gap-2 overflow-x-auto p-2 pr-14 sm:p-3 sm:pr-14">
                      <span className="w-6 shrink-0 pb-2.5 text-xs font-medium text-gray-400">
                        {index + 1}
                      </span>
                    {textCell(
                      row,
                      index,
                      "componentId",
                      index === 0 ? `${t("limsComponentId")} *` : "",
                      "w-32",
                      legacy
                    )}
                    {textCell(
                      row,
                      index,
                      "name",
                      index === 0 ? `${t("name")} *` : "",
                      "w-44",
                      legacy
                    )}
                    {textCell(
                      row,
                      index,
                      "description",
                      index === 0 ? `${t("description")} *` : "",
                      "w-56",
                      legacy
                    )}
                    <Cell
                      label={index === 0 ? `${t("limsType")} *` : ""}
                      width="w-40"
                      tooltip={index === 0 ? t("limsTypeHint") : undefined}
                    >
                      <SelectDropdown
                        options={typeOptions}
                        value={isTyped(row) ? row.type : ""}
                        onChange={(value) => changeType(index, value)}
                        placeholder={t("limsPickType")}
                        disabled={disabled}
                        ariaLabel={t("limsType")}
                        portal
                      />
                    </Cell>
                  </div>
                  {!disabled ? (
                    <div className="sticky right-0 top-0 flex h-full items-center bg-white/95 px-3 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur-xs dark:bg-gray-800/95 dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                      <button
                        type="button"
                        aria-label={`${t("delete")} ${index + 1}`}
                        onClick={() => removeRow(index)}
                        className="rounded p-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {legacy ? (
                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <span className="rounded bg-warning-100 px-1.5 py-0.5 font-semibold text-warning-800 dark:bg-warning-500/15 dark:text-warning-300">
                      {t("limsLegacy")}
                    </span>
                    <span className="truncate">
                      {legacySummary(row) || "—"}
                    </span>
                    <HelpTooltip content={t("limsLegacyComponentHint")} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("limsNoComponents")}
        </div>
      )}

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ComponentRowsEditor;
