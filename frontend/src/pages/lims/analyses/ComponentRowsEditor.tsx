import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import Label from "@/components/common/form/Label";
import HelpTooltip from "@/components/common/HelpTooltip";
import AsyncSelect from "@/components/data/AsyncSelect";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { PlusIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsPhraseList } from "@/pages/lims/phrases/LimsPhrase.api";
import { useUnitOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import type { LimsComponentRow } from "./LimsAnalysis.types";
import {
  BOOLEAN_OPTIONS,
  COMPONENT_ENTITIES,
  COMPONENT_TYPES,
  TYPE_FIELDS,
  TYPE_LABELS,
  TYPE_SPECIFIC_KEYS,
  isLegacy,
  isTyped,
  parseCriteria,
  type ComponentType
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

const entityOptions = COMPONENT_ENTITIES.map(({ value, label }) => ({
  value,
  label
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
    <span className="mb-1 block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
      {label}
      {tooltip ? <HelpTooltip content={tooltip} /> : null}
    </span>
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

  // Pick lists are few and small — one request feeds both the List and Option dropdowns.
  const { data: pickLists } = useQuery({
    queryKey: ["limsPhrase", "all-with-entries"],
    queryFn: ({ signal }) =>
      fetchLimsPhraseList(false, { page: 1, limit: 200 }, signal),
    staleTime: 60_000
  });

  const listOptions = useMemo(
    () =>
      (pickLists?.rows ?? []).map((list) => ({
        value: list.phrase,
        label: list.name
      })),
    [pickLists]
  );

  const entryOptionsFor = (listCode: string) =>
    (pickLists?.rows ?? [])
      .find((list) => list.phrase === listCode)
      ?.entries?.map((entry) => ({
        value: String(entry.phraseEntryId ?? ""),
        label: String(entry.name ?? entry.phraseEntryId ?? "")
      }))
      .filter((option) => option.value) ?? [];

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

  const addRow = () =>
    onChange([...rows, { componentId: "", name: "", description: "" }]);

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

  const renderTypeField = (
    row: LimsComponentRow & { type: ComponentType },
    index: number,
    field: (typeof TYPE_FIELDS)[ComponentType][number]
  ) => {
    switch (field) {
      case "unit":
        return (
          <Cell key={field} label={t("limsUnit")} width="w-36">
            <AsyncSelect
              useOptions={useUnitOptions}
              value={str(row.unit)}
              onChange={(value) => patchRow(index, { unit: value })}
              disabled={disabled}
              placeholder={t("select", { entity: t("limsUnit") })}
              initialSelectedOptions={
                row.unit
                  ? [{ value: str(row.unit), label: str(row.unit) }]
                  : undefined
              }
            />
          </Cell>
        );
      case "formula":
        return textCell(
          row,
          index,
          "formula",
          t("limsFormula"),
          "w-72",
          false,
          {
            placeholder: "{TITRE} * {FACTOR} / {WEIGHT} * 100",
            tooltip: t("limsFormulaHint")
          }
        );
      case "min":
        return textCell(row, index, "min", t("limsMin"), "w-24", false, {
          inputMode: "decimal"
        });
      case "max":
        return textCell(row, index, "max", t("limsMax"), "w-24", false, {
          inputMode: "decimal"
        });
      case "list":
        return (
          <Cell key={field} label={t("limsList")} width="w-44">
            <SelectDropdown
              options={listOptions}
              value={str(row.list)}
              onChange={(value) => patchRow(index, { list: value, option: "" })}
              placeholder={t("select", { entity: t("limsList") })}
              disabled={disabled}
              ariaLabel={t("limsList")}
              portal
            />
          </Cell>
        );
      case "option":
        return row.type === "BOOLEAN" ? (
          <Cell key={field} label={t("limsAnswers")} width="w-56">
            <SelectDropdown
              options={BOOLEAN_OPTIONS}
              value={str(row.option)}
              onChange={(value) => patchRow(index, { option: value })}
              placeholder={t("select", { entity: t("limsAnswers") })}
              disabled={disabled}
              ariaLabel={t("limsAnswers")}
              portal
            />
          </Cell>
        ) : (
          <Cell
            key={field}
            label={t("limsDefaultOption")}
            width="w-44"
            tooltip={t("limsDefaultOptionHint")}
          >
            <SelectDropdown
              options={entryOptionsFor(str(row.list))}
              value={str(row.option)}
              onChange={(value) => patchRow(index, { option: value })}
              placeholder={t("select", { entity: t("limsOption") })}
              disabled={disabled || !row.list}
              ariaLabel={t("limsDefaultOption")}
              portal
            />
          </Cell>
        );
      case "entity":
        return (
          <Cell key={field} label={t("limsEntity")} width="w-44">
            <SelectDropdown
              options={entityOptions}
              value={str(row.entity)}
              onChange={(value) =>
                patchRow(index, { entity: value, entityCriteria: "" })
              }
              placeholder={t("select", { entity: t("limsEntity") })}
              disabled={disabled}
              ariaLabel={t("limsEntity")}
              portal
            />
          </Cell>
        );
      case "entityCriteria": {
        const entity = COMPONENT_ENTITIES.find((e) => e.value === row.entity);
        const criteria = parseCriteria(row.entityCriteria);
        const criteriaField = entity?.criteria.find(
          (c) => c.field === criteria?.field
        );
        const writeCriteria = (next: {
          field: string;
          value: string;
          label?: string;
        }) =>
          patchRow(index, {
            entityCriteria: next.field ? JSON.stringify(next) : ""
          });
        return (
          <div key={field} className="flex shrink-0 gap-2">
            <Cell
              label={t("limsCriteriaField")}
              width="w-40"
              tooltip={t("limsEntityCriteriaHint")}
            >
              <SelectDropdown
                options={[
                  { value: "", label: "—" },
                  ...(entity?.criteria ?? []).map((c) => ({
                    value: c.field,
                    label: c.label
                  }))
                ]}
                value={criteria?.field ?? ""}
                onChange={(value) => writeCriteria({ field: value, value: "" })}
                placeholder={t("limsCriteriaField")}
                disabled={disabled || !entity}
                ariaLabel={t("limsCriteriaField")}
                portal
              />
            </Cell>
            <Cell label={t("limsCriteriaValue")} width="w-48">
              {criteriaField ? (
                <AsyncSelect
                  useOptions={criteriaField.useOptions}
                  value={criteria?.value ?? ""}
                  onChange={() => undefined}
                  onChangeOption={(option) =>
                    writeCriteria({
                      field: criteriaField.field,
                      value: option?.value ?? "",
                      label: option?.label
                    })
                  }
                  disabled={disabled}
                  placeholder={t("select", { entity: criteriaField.label })}
                  initialSelectedOptions={
                    criteria?.value && criteria.label
                      ? [{ value: criteria.value, label: criteria.label }]
                      : undefined
                  }
                />
              ) : (
                <input className={inputClasses} disabled value="" readOnly />
              )}
            </Cell>
          </div>
        );
      }
    }
  };

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
        <div className="space-y-2">
          {rows.map((row, index) => {
            const legacy = isLegacy(row);
            return (
              <div
                key={row.id ?? `new-${index}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* One line per component; scrolls sideways rather than wrapping. */}
                <div className="flex items-end gap-2 overflow-x-auto p-3">
                  <span className="w-6 shrink-0 pb-2.5 text-xs font-medium text-gray-400">
                    {index + 1}
                  </span>
                  {textCell(
                    row,
                    index,
                    "componentId",
                    `${t("limsComponentId")} *`,
                    "w-32",
                    legacy
                  )}
                  {textCell(
                    row,
                    index,
                    "name",
                    `${t("name")} *`,
                    "w-44",
                    legacy
                  )}
                  {textCell(
                    row,
                    index,
                    "description",
                    `${t("description")} *`,
                    "w-56",
                    legacy
                  )}
                  <Cell
                    label={`${t("limsType")} *`}
                    width="w-40"
                    tooltip={t("limsTypeHint")}
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
                  {isTyped(row) &&
                    TYPE_FIELDS[row.type].map((field) =>
                      renderTypeField(row, index, field)
                    )}
                  {!disabled ? (
                    <button
                      type="button"
                      aria-label={`${t("delete")} ${index + 1}`}
                      onClick={() => removeRow(index)}
                      className="ml-auto shrink-0 self-end rounded p-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
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
      ) : (
        <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("limsNoComponents")}
        </div>
      )}

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
};

export default ComponentRowsEditor;
