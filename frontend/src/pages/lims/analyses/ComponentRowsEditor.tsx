import { useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useFormHeaderAction } from "@/components/data/formHeaderContext";
import TextArea from "@/components/common/form/input/TextArea";
import HelpTooltip from "@/components/common/HelpTooltip";
import AsyncSelect from "@/components/data/AsyncSelect";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { ChevronDownIcon, ChevronUpIcon } from "@/public/icons";
import { useEntryEditorState } from "@/components/data/entryEditorContext";
import EntryTable, {
  type EntryTableColumn
} from "@/components/data/EntryTable";
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

const BLANK: LimsComponentRow = { componentId: "", name: "", description: "" };

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

/** Test Template components: one entry form with its own Save on top, and the saved components
 * in a paged table below (View · Edit · Delete). The Type decides which inputs the form shows;
 * changing it clears the old type's values so nothing stale is saved. */
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

  // The entry form holds a new component (editIndex null) or a copy of the one being edited.
  const [draft, setDraft] = useState<LimsComponentRow>(BLANK);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [viewing, setViewing] = useState(false);
  const [entryError, setEntryError] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const touched = useRef(new WeakSet<object>());
  const [removedSaved, setRemovedSaved] = useState(0);
  const [entryDirty, setEntryDirty] = useState(false);

  // What the rows would be if this entry were saved — validation and the formula need it.
  const candidate = useMemo(
    () =>
      editIndex === null
        ? [...rows, draft]
        : rows.map((row, i) => (i === editIndex ? draft : row)),
    [rows, draft, editIndex]
  );
  const draftIndex = editIndex ?? rows.length;
  const duplicates = useMemo(() => duplicateRows(candidate), [candidate]);
  const draftStarted = Boolean(
    str(draft.componentId) || str(draft.name) || str(draft.type)
  );

  const reset = () => {
    setEntryDirty(false);
    setDraft(BLANK);
    setEditIndex(null);
    setViewing(false);
    setEntryError(undefined);
    setExpanded(false);
  };

  const focusForm = () => {
    reset();
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  useFormHeaderAction(
    disabled ? null : { label: t("limsAddComponent"), onClick: focusForm }
  );

  const patchRow = (_index: number, patch: Partial<LimsComponentRow>) => {
    setEntryError(undefined);
    setEntryDirty(true);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const changeType = (index: number, type: string) => {
    const cleared = Object.fromEntries(
      TYPE_SPECIFIC_KEYS.map((key) => [key, ""])
    );
    patchRow(index, { ...cleared, type });
  };

  const saveEntry = () => {
    const problem = validateComponentRows(candidate, draftIndex);
    if (problem) {
      setEntryError(problem);
      return;
    }
    touched.current.add(draft);
    onChange(candidate);
    reset();
  };

  const open = (index: number, readOnly: boolean) => {
    setEntryDirty(false);
    setDraft({ ...rows[index] });
    setEditIndex(index);
    setViewing(readOnly || isLegacy(rows[index]));
    setEntryError(undefined);
    setExpanded(false);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const removeRow = (index: number) => {
    if (!touched.current.has(rows[index])) setRemovedSaved((n) => n + 1);
    if (editIndex === index) reset();
    else if (editIndex !== null && editIndex > index)
      setEditIndex(editIndex - 1);
    onChange(rows.filter((_, i) => i !== index));
  };

  const optionLabel = (row: LimsComponentRow) => {
    const code = row.type === "BOOLEAN" ? BOOLEAN_ANSWERS_LIST : str(row.list);
    return (
      entryOptionsFor(code).find((o) => o.value === row.option)?.label ??
      str(row.option)
    );
  };

  /** What a component's Type is set up with, in plain words. */
  const entryDetail = (row: LimsComponentRow) => {
    const parts: string[] = [];
    if (str(row.unit)) parts.push(str(row.unit));
    if (str(row.formula)) parts.push(`ƒ ${str(row.formula)}`);
    if (row.type === "LIST" && str(row.list))
      parts.push(
        listOptions.find((list) => list.value === row.list)?.label ??
          str(row.list)
      );
    if (row.type === "LIST" && str(row.option))
      parts.push(`${t("limsDefaultOption")}: ${optionLabel(row)}`);
    if (str(row.entity)) parts.push(entityLabel(str(row.entity)));
    return parts.join(" · ");
  };

  /** The rules a result is checked against: limits, allowed answers, allowed list entries. */
  const validationText = (row: LimsComponentRow) => {
    const parts: string[] = [];
    if (str(row.min)) parts.push(`${t("limsMin")}: ${str(row.min)}`);
    if (str(row.max)) parts.push(`${t("limsMax")}: ${str(row.max)}`);
    if (row.type === "BOOLEAN" && str(row.option))
      parts.push(`${t("limsAnswers")}: ${optionLabel(row)}`);
    if (row.type === "LIST" && str(row.list))
      parts.push(
        t("validationFromList", {
          list:
            listOptions.find((list) => list.value === row.list)?.label ??
            str(row.list)
        })
      );
    return parts.join(", ") || "—";
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
        disabled={locked}
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
                  onClick={() => setBuilderOpen(true)}
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

  const ro = viewing || disabled;
  const duplicateId = duplicates.ids.has(draftIndex);
  const duplicateName = duplicates.names.has(draftIndex);
  const showForm = !disabled || editIndex !== null;

  useEntryEditorState({
    unsaved:
      rows.filter((row) => touched.current.has(row)).length + removedSaved,
    pendingEntry: entryDirty && !viewing,
    label: t("limsComponents"),
    focus: () =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    clearEntry: reset
  });

  const columns: EntryTableColumn<LimsComponentRow>[] = [
    {
      key: "componentId",
      header: t("limsComponentId"),
      render: (row) => <span className="font-mono">{str(row.componentId)}</span>
    },
    { key: "name", header: t("name"), render: (row) => str(row.name) },
    {
      key: "type",
      header: t("limsType"),
      render: (row) => (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {isTyped(row) ? TYPE_LABELS[row.type] : t("limsLegacy")}
        </span>
      )
    },
    {
      key: "details",
      header: t("componentDetails"),
      render: (row) =>
        (isLegacy(row) ? legacySummary(row) : entryDetail(row)) || "—"
    },
    {
      key: "validation",
      header: t("componentValidation"),
      tooltip: t("componentValidationHint"),
      render: (row) => validationText(row)
    },
    {
      key: "description",
      header: t("description"),
      render: (row) => str(row.description) || "—"
    }
  ];

  return (
    <div className="min-w-0 space-y-4">
      <Label className="mb-0">{t("limsComponents")}</Label>

      {showForm ? (
        <div
          ref={formRef}
          className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <p className="px-3 pt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            {editIndex === null
              ? t("limsAddComponent")
              : `${viewing ? t("limsEntryView") : t("edit")} · ${str(draft.componentId) || editIndex + 1}`}
          </p>
          <div className="flex items-end gap-2 overflow-x-auto p-3">
            {textCell(
              draft,
              draftIndex,
              "componentId",
              `${t("limsComponentId")} *`,
              "w-32",
              ro,
              { invalid: duplicateId && draftStarted }
            )}
            {textCell(draft, draftIndex, "name", `${t("name")} *`, "w-44", ro, {
              invalid: duplicateName && draftStarted
            })}
            <Cell label={`${t("description")} *`} width="w-64">
              <div className="flex gap-1">
                <input
                  aria-label={t("description")}
                  className={`${inputClasses} ${okBorder}`}
                  value={str(draft.description)}
                  disabled={ro}
                  onChange={(event) =>
                    patchRow(draftIndex, { description: event.target.value })
                  }
                />
                <button
                  type="button"
                  aria-label={t("limsExpandDescription")}
                  aria-expanded={expanded}
                  title={t("limsExpandDescription")}
                  onClick={() => setExpanded((prev) => !prev)}
                  className="shrink-0 rounded-lg border border-gray-300 px-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  {expanded ? (
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
                value={isTyped(draft) ? draft.type : ""}
                onChange={(value) => changeType(draftIndex, value)}
                placeholder={t("limsPickType")}
                disabled={ro}
                ariaLabel={t("limsType")}
                portal
              />
            </Cell>
            {isTyped(draft) &&
              TYPE_FIELDS[draft.type].map((field) =>
                renderTypeField(draft, draftIndex, field, ro)
              )}
          </div>
          {expanded ? (
            <div className="px-3 pb-3">
              <TextArea
                rows={6}
                value={str(draft.description)}
                disabled={ro}
                onChange={(value) =>
                  patchRow(draftIndex, { description: value })
                }
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          ) : null}
          {draftStarted && (duplicateId || duplicateName) ? (
            <p className="px-3 pb-2 text-xs text-red-500">
              {[
                duplicateId && t("limsDuplicateComponentId"),
                duplicateName && t("limsDuplicateComponentName")
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {entryError ? (
            <p className="px-3 pb-2 text-xs text-red-500">{entryError}</p>
          ) : null}
          {editIndex !== null && isLegacy(rows[editIndex] ?? {}) ? (
            <p className="flex items-center gap-1 px-3 pb-2 text-xs text-gray-500">
              {t("limsLegacy")}
              <HelpTooltip content={t("limsLegacyComponentHint")} />
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
            {!viewing ? (
              <span className="mr-auto text-xs text-gray-500 dark:text-gray-400">
                {t("entryAddedHint")}
              </span>
            ) : null}
            {editIndex !== null || draftStarted ? (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                {viewing ? t("close") : t("cancel")}
              </Button>
            ) : null}
            {!viewing ? (
              <Button type="button" size="sm" onClick={saveEntry}>
                {t("save")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <EntryTable
        label={t("limsComponents")}
        columns={columns}
        rows={rows}
        emptyLabel={t("limsNoComponents")}
        activeIndex={editIndex}
        onView={(index) => open(index, true)}
        onEdit={
          disabled ? undefined : (index) => open(index, isLegacy(rows[index]))
        }
        onDelete={disabled ? undefined : removeRow}
        isUnsaved={(row) => touched.current.has(row)}
      />

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}

      {builderOpen ? (
        <FormulaBuilder
          formula={str(draft.formula)}
          selfId={str(draft.componentId).trim()}
          selfName={str(draft.name) || str(draft.componentId)}
          rows={candidate}
          onApply={(formula) => {
            patchRow(draftIndex, { formula });
            setBuilderOpen(false);
          }}
          onClose={() => setBuilderOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default ComponentRowsEditor;
