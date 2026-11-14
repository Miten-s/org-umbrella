import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useFormHeaderAction } from "@/components/data/formHeaderContext";
import TextArea from "@/components/common/form/input/TextArea";
import HelpTooltip from "@/components/common/HelpTooltip";
import AsyncSelect from "@/components/data/AsyncSelect";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsPhraseList } from "@/pages/lims/phrases/LimsPhrase.api";
import { fetchAllTemplatesForEntities } from "@/pages/lims/entity-templates/LimsEntityTemplate.api";
import { useUnitOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import type { LimsComponentRow } from "./LimsAnalysis.types";
import FormulaBuilder from "./FormulaBuilder";
import {
  BOOLEAN_ANSWERS_LIST,
  COMPONENT_ENTITIES,
  COMPONENT_TYPES,
  TYPE_FIELDS,
  TYPE_LABELS,
  TYPE_SPECIFIC_KEYS,
  duplicateRows,
  isLegacy,
  isTyped,
  validateComponentRows,
  type ComponentType
} from "./componentTypes";

interface ComponentRowsEditorProps {
  rows: LimsComponentRow[];
  onChange: (rows: LimsComponentRow[]) => void;
  disabled?: boolean;
  error?: string;
}

const inputClasses =
  "h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";
const okBorder = "border-gray-300 dark:border-gray-700";
const errorBorder = "border-red-500 dark:border-red-500";

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
    <span className="mb-1 block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
      {label}
      {tooltip ? <HelpTooltip content={tooltip} /> : null}
    </span>
    {children}
  </div>
);

const entityLabel = (value: string) =>
  COMPONENT_ENTITIES.find((entity) => entity.value === value)?.label ?? value;

/** One dropdown of every Entity Template; each option names its table, which is then the
 * component's Entity. */
const EntityTemplateSelect = ({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (templateId: string, entity: string) => void;
  disabled: boolean;
}) => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["limsEntityTemplate", "for-entity", "all"],
    queryFn: ({ signal }) => fetchAllTemplatesForEntities(signal)
  });
  const templates = data ?? [];
  return (
    <SelectDropdown
      options={templates.map((row) => ({
        value: row.id,
        label: `${row.name} · ${entityLabel(row.entity)}`
      }))}
      value={value}
      onChange={(id) =>
        onChange(id, templates.find((row) => row.id === id)?.entity ?? "")
      }
      placeholder={t("select", { entity: t("limsEntityTemplate") })}
      disabled={disabled}
      ariaLabel={t("limsEntityTemplate")}
      portal
    />
  );
};

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

  const duplicates = useMemo(() => duplicateRows(rows), [rows]);
  // Rows being edited / peeked at (by index), the values to restore on Cancel, and each
  // entry's own validation message.
  const [editing, setEditing] = useState<Set<number>>(() => new Set());
  const [viewing, setViewing] = useState<Set<number>>(() => new Set());
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(
    () => new Map()
  );
  const snapshots = useRef(new Map<number, LimsComponentRow>());
  const withIndex = (set: Set<number>, index: number, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(index);
    else next.delete(index);
    return next;
  };
  const shiftDown = (set: Set<number>, removed: number) =>
    new Set(
      [...set]
        .filter((i) => i !== removed)
        .map((i) => (i > removed ? i - 1 : i))
    );

  const addRow = () => {
    setEditing((prev) => withIndex(prev, rows.length, true));
    onChange([...rows, { componentId: "", name: "", description: "" }]);
  };
  useFormHeaderAction(
    disabled ? null : { label: t("limsAddComponent"), onClick: addRow }
  );
  // A row added from the modal header lands at the bottom — bring it into view.
  const listRef = useRef<HTMLDivElement>(null);
  const rowCount = useRef(rows.length);
  useEffect(() => {
    if (rows.length > rowCount.current)
      listRef.current?.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    rowCount.current = rows.length;
  }, [rows.length]);
  const [builderRow, setBuilderRow] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const patchRow = (index: number, patch: Partial<LimsComponentRow>) => {
    setRowErrors((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const changeType = (index: number, type: string) => {
    const cleared = Object.fromEntries(
      TYPE_SPECIFIC_KEYS.map((key) => [key, ""])
    );
    patchRow(index, { ...cleared, type });
  };

  const removeRow = (index: number) => {
    setEditing((prev) => shiftDown(prev, index));
    setViewing((prev) => shiftDown(prev, index));
    setRowErrors((prev) => {
      const next = new Map<number, string>();
      prev.forEach((message, i) => {
        if (i !== index) next.set(i > index ? i - 1 : i, message);
      });
      return next;
    });
    const kept = new Map<number, LimsComponentRow>();
    snapshots.current.forEach((row, i) => {
      if (i !== index) kept.set(i > index ? i - 1 : i, row);
    });
    snapshots.current = kept;
    onChange(rows.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    snapshots.current.set(index, rows[index]);
    setViewing((prev) => withIndex(prev, index, false));
    setEditing((prev) => withIndex(prev, index, true));
  };

  const saveEntry = (index: number) => {
    const problem = validateComponentRows(rows, index);
    setRowErrors((prev) => {
      const next = new Map(prev);
      if (problem) next.set(index, problem);
      else next.delete(index);
      return next;
    });
    if (problem) return;
    snapshots.current.delete(index);
    setEditing((prev) => withIndex(prev, index, false));
  };

  const cancelEntry = (index: number) => {
    const before = snapshots.current.get(index);
    if (!before) return removeRow(index);
    snapshots.current.delete(index);
    setRowErrors((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
    setEditing((prev) => withIndex(prev, index, false));
    onChange(rows.map((row, i) => (i === index ? before : row)));
  };

  /** One-line digest of a saved entry: what its Type needs, in plain words. */
  const entryDetail = (row: LimsComponentRow) => {
    const parts: string[] = [];
    if (str(row.unit)) parts.push(str(row.unit));
    if (str(row.min) || str(row.max))
      parts.push(`${str(row.min) || "…"} – ${str(row.max) || "…"}`);
    if (str(row.formula)) parts.push(`ƒ ${str(row.formula)}`);
    if (row.type === "LIST" && str(row.list))
      parts.push(
        listOptions.find((list) => list.value === row.list)?.label ??
          str(row.list)
      );
    if (str(row.option)) {
      const code =
        row.type === "BOOLEAN" ? BOOLEAN_ANSWERS_LIST : str(row.list);
      parts.push(
        entryOptionsFor(code).find((o) => o.value === row.option)?.label ??
          str(row.option)
      );
    }
    if (str(row.entity)) parts.push(entityLabel(str(row.entity)));
    return parts.join(" · ");
  };

  const textCell = (
    row: LimsComponentRow,
    index: number,
    key: keyof LimsComponentRow & string,
    label: string,
    width: string,
    locked: boolean,
    extra?: {
      placeholder?: string;
      tooltip?: ReactNode;
      inputMode?: "decimal";
      invalid?: boolean;
    }
  ) => (
    <Cell key={key} label={label} width={width} tooltip={extra?.tooltip}>
      <input
        aria-label={label}
        aria-invalid={extra?.invalid || undefined}
        className={`${inputClasses} ${extra?.invalid ? errorBorder : okBorder}`}
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
    field: (typeof TYPE_FIELDS)[ComponentType][number],
    ro: boolean
  ) => {
    switch (field) {
      case "unit":
        return (
          <Cell key={field} label={t("limsUnit")} width="w-36">
            <AsyncSelect
              useOptions={useUnitOptions}
              value={str(row.unit)}
              onChange={(value) => patchRow(index, { unit: value })}
              disabled={ro}
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
        return (
          <Cell
            key={field}
            label={t("limsFormula")}
            width="w-80"
            tooltip={t("limsFormulaHint")}
          >
            <div className="flex gap-1">
              <input
                aria-label={t("limsFormula")}
                className={`${inputClasses} ${okBorder} font-mono`}
                value={str(row.formula)}
                placeholder="{TITRE} * {FACTOR} / {WEIGHT} * 100"
                disabled={ro}
                onChange={(event) =>
                  patchRow(index, { formula: event.target.value })
                }
              />
              {!ro ? (
                <button
                  type="button"
                  aria-label={t("limsBuildFormula")}
                  title={t("limsBuildFormula")}
                  onClick={() => setBuilderRow(index)}
                  className="shrink-0 rounded-lg border border-gray-300 px-2.5 text-sm font-semibold italic text-brand-600 hover:bg-brand-50 dark:border-gray-700 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  ƒx
                </button>
              ) : null}
            </div>
          </Cell>
        );
      case "min":
        return textCell(row, index, "min", t("limsMin"), "w-24", ro, {
          inputMode: "decimal"
        });
      case "max":
        return textCell(row, index, "max", t("limsMax"), "w-24", ro, {
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
              disabled={ro}
              ariaLabel={t("limsList")}
              portal
            />
          </Cell>
        );
      case "option":
        return row.type === "BOOLEAN" ? (
          <Cell
            key={field}
            label={t("limsAnswers")}
            width="w-56"
            tooltip={t("limsAnswersHint")}
          >
            <SelectDropdown
              options={entryOptionsFor(BOOLEAN_ANSWERS_LIST)}
              value={str(row.option)}
              onChange={(value) => patchRow(index, { option: value })}
              placeholder={t("select", { entity: t("limsAnswers") })}
              disabled={ro}
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
              disabled={ro || !row.list}
              ariaLabel={t("limsDefaultOption")}
              portal
            />
          </Cell>
        );
      case "entityTemplateId":
        return (
          <Cell
            key={field}
            label={t("limsEntityTemplate")}
            width="w-72"
            tooltip={t("limsEntityTemplateHint")}
          >
            <EntityTemplateSelect
              value={str(row.entityTemplateId)}
              onChange={(value, entity) =>
                patchRow(index, { entityTemplateId: value, entity })
              }
              disabled={ro}
            />
          </Cell>
        );
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
        <div ref={listRef} className="space-y-2">
          {rows.map((row, index) => {
            const legacy = isLegacy(row);
            const rowKey = row.id ?? `new-${index}`;
            const isExpanded = expanded.has(rowKey);
            const isEditing = editing.has(index) && !legacy && !disabled;
            const open = isEditing || (viewing.has(index) && !legacy);
            const ro = !isEditing;
            const duplicateId = duplicates.ids.has(index);
            const duplicateName = duplicates.names.has(index);
            const rowError = rowErrors.get(index);
            const actions = (
              <div className="ml-auto flex shrink-0 items-center gap-1 self-end">
                {!legacy && !isEditing ? (
                  <button
                    type="button"
                    aria-label={`${t("limsEntryView")} ${index + 1}`}
                    title={t("limsEntryView")}
                    onClick={() =>
                      setViewing((prev) => withIndex(prev, index, !open))
                    }
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                ) : null}
                {!legacy && !disabled && !isEditing ? (
                  <button
                    type="button"
                    aria-label={`${t("edit")} ${index + 1}`}
                    title={t("edit")}
                    onClick={() => startEdit(index)}
                    className="rounded p-2 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                ) : null}
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`${t("delete")} ${index + 1}`}
                    title={t("delete")}
                    onClick={() => removeRow(index)}
                    className="rounded p-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <TrashBinIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            );
            return (
              <div
                key={rowKey}
                className={`rounded-lg border ${
                  isEditing
                    ? "border-brand-300 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-500/5"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {!open ? (
                  <div className="flex items-center gap-3 p-3">
                    <span className="w-6 shrink-0 text-xs font-medium text-gray-400">
                      {index + 1}
                    </span>
                    <span className="w-28 shrink-0 truncate font-mono text-sm text-gray-900 dark:text-white">
                      {str(row.componentId)}
                    </span>
                    <span className="w-40 shrink-0 truncate text-sm font-medium text-gray-900 dark:text-white">
                      {str(row.name)}
                    </span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {isTyped(row) ? TYPE_LABELS[row.type] : t("limsLegacy")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                      {legacy
                        ? legacySummary(row)
                        : [entryDetail(row), str(row.description)]
                            .filter(Boolean)
                            .join(" — ")}
                    </span>
                    {actions}
                  </div>
                ) : (
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
                      ro,
                      { invalid: duplicateId }
                    )}
                    {textCell(
                      row,
                      index,
                      "name",
                      `${t("name")} *`,
                      "w-44",
                      ro,
                      { invalid: duplicateName }
                    )}
                    <Cell label={`${t("description")} *`} width="w-64">
                      <div className="flex gap-1">
                        <input
                          aria-label={t("description")}
                          className={`${inputClasses} ${okBorder}`}
                          value={str(row.description)}
                          disabled={ro}
                          onChange={(event) =>
                            patchRow(index, { description: event.target.value })
                          }
                        />
                        <button
                          type="button"
                          aria-label={t("limsExpandDescription")}
                          aria-expanded={isExpanded}
                          title={t("limsExpandDescription")}
                          onClick={() => toggleExpanded(rowKey)}
                          className="shrink-0 rounded-lg border border-gray-300 px-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Cell>
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
                        disabled={ro}
                        ariaLabel={t("limsType")}
                        portal
                      />
                    </Cell>
                    {isTyped(row) &&
                      TYPE_FIELDS[row.type].map((field) =>
                        renderTypeField(row, index, field, ro)
                      )}
                    {actions}
                  </div>
                )}
                {open && isExpanded ? (
                  <div className="px-3 pb-3 pl-11">
                    <TextArea
                      rows={8}
                      value={str(row.description)}
                      disabled={ro}
                      onChange={(value) =>
                        patchRow(index, { description: value })
                      }
                      className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                ) : null}
                {isEditing ? (
                  <div className="flex items-center justify-end gap-2 border-t border-brand-100 px-3 py-2 dark:border-brand-500/20">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => cancelEntry(index)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveEntry(index)}
                    >
                      {t("save")}
                    </Button>
                  </div>
                ) : null}
                {open && (duplicateId || duplicateName) ? (
                  <p className="px-3 pb-2 pl-11 text-xs text-red-500">
                    {[
                      duplicateId && t("limsDuplicateComponentId"),
                      duplicateName && t("limsDuplicateComponentName")
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                {rowError ? (
                  <p className="px-3 pb-2 pl-11 text-xs text-red-500">
                    {rowError}
                  </p>
                ) : null}
                {legacy ? (
                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
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

      {builderRow !== null && rows[builderRow] ? (
        <FormulaBuilder
          formula={str(rows[builderRow].formula)}
          selfId={str(rows[builderRow].componentId).trim()}
          selfName={
            str(rows[builderRow].name) || str(rows[builderRow].componentId)
          }
          rows={rows}
          onApply={(formula) => {
            patchRow(builderRow, { formula });
            setBuilderRow(null);
          }}
          onClose={() => setBuilderRow(null)}
        />
      ) : null}
    </div>
  );
};

export default ComponentRowsEditor;
