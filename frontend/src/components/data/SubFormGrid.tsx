import Button from "@/components/ui/button/Button";
import Label from "@/components/common/form/Label";
import HelpTooltip from "@/components/common/HelpTooltip";
import DateField from "@/components/common/form/input/DateField";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import AsyncSelect from "@/components/data/AsyncSelect";
import type { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { AsyncOption } from "@/lib/query/listTypes";
import { useTranslation } from "react-i18next";
import { useRef, useState, type ReactNode } from "react";
import { useFormHeaderAction } from "./formHeaderContext";
import { useEntryEditorState } from "./entryEditorContext";
import EntryTable, { type EntryTableColumn } from "./EntryTable";

/** "number" coerces to a real JS number, for an actual numeric DB column. "numeric-text" keeps
 * a plain string, for a loosely-typed STRING column (e.g. Spec Limit's `min`/`max`) — a real number there 400s. */
export type SubFormColumnType =
  | "text"
  | "number"
  | "numeric-text"
  | "date"
  | "checkbox"
  | "select"
  | "async-select";

export interface SubFormColumn<R> {
  key: keyof R & string;
  header: string;
  /** Shows a "?" next to the header that reveals this text on hover. */
  tooltip?: ReactNode;
  type?: SubFormColumnType;
  /** Required when `type` is "select" — a small, fixed set of choices. */
  options?: { label: string; value: string }[];
  /** Required for "async-select" — a server-searched/paginated reference to another LIMS
   * entity. Pass the bound `useXOptions` hook itself, not its already-called result. */
  useOptions?: (
    args: {
      search: string;
      enabled?: boolean;
      selectedValues?: string[];
    },
    /** The row this cell belongs to, so a column can scope its options to a sibling cell
     * already picked on the same row. Ignored by hooks without this second param. */
    row?: R
  ) => ReturnType<typeof useAsyncOptions>;
  placeholder?: string;
  /** Tailwind width class, e.g. "w-40". */
  className?: string;
  /** Only for "async-select": fires after a selection, alongside the normal write of
   * `column.key`, to populate other cells on the same row (e.g. a Component's Min/Max/Unit). */
  onSelectOption?: (row: R, option: AsyncOption) => Partial<R>;
  /** Only for "async-select": the saved value's known label, so it shows even when that
   * option isn't in the loaded (or filtered) option list. */
  selectedOption?: (row: R) => AsyncOption | undefined;
  /** Locks this cell per-row, on top of the grid-wide `disabled`. */
  readOnly?: (row: R) => boolean;
  /** Extra cells to write alongside this one when its value changes — e.g. clearing a
   * sibling cell that the new value makes irrelevant. */
  onChangeValue?: (row: R, value: unknown) => Partial<R>;
}

export interface SubFormGridProps<R extends Record<string, unknown>> {
  label: string;
  columns: SubFormColumn<R>[];
  rows: R[];
  onChange: (rows: R[]) => void;
  /** Factory for a blank row; defaults to `{}`. */
  newRow?: () => R;
  /** View mode — read-only table, no entry form. */
  disabled?: boolean;
  /** Off for lists that can only be pruned (e.g. uploaded attachments). */
  allowAdd?: boolean;
  addLabel?: string;
  emptyLabel?: string;
  error?: string;
  /** What's wrong with an entry before it is added; undefined when it is fine. */
  validateRow?: (row: R) => string | undefined;
  /** @deprecated kept for callers; every grid now uses the entry form + table layout. */
  layout?: "table" | "stacked" | "auto";
}

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";

const isBlank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

/** Repeatable rows inside a form: one entry form with its own Save on top, and the added rows in
 * a paged table below (View · Edit · Delete). Form state only — nothing is sent until the page's
 * own Save; use `DataTable` for server-driven lists. */
function SubFormGrid<R extends Record<string, unknown>>({
  label,
  columns,
  rows,
  onChange,
  newRow,
  disabled = false,
  allowAdd = true,
  addLabel,
  emptyLabel,
  error,
  validateRow
}: SubFormGridProps<R>) {
  const { t } = useTranslation();
  const blank = () => (newRow ? newRow() : ({} as R));
  const [draft, setDraft] = useState<R>(blank);
  // Which row the entry form holds: null = a new entry; `viewing` shows it read-only.
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [viewing, setViewing] = useState(false);
  const [entryError, setEntryError] = useState<string>();
  // Labels picked in async dropdowns, so the table can show names rather than ids.
  const labels = useRef(new WeakMap<object, Record<string, string>>());
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  // Rows added or edited here, and saved rows removed, since the page last saved.
  const touched = useRef(new WeakSet<object>());
  const [removedSaved, setRemovedSaved] = useState(0);
  const [entryDirty, setEntryDirty] = useState(false);

  const showForm = (!disabled && allowAdd) || editIndex !== null;

  const reset = () => {
    setEntryDirty(false);
    setDraft(blank());
    setDraftLabels({});
    setEditIndex(null);
    setViewing(false);
    setEntryError(undefined);
  };

  const focusForm = () => {
    reset();
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  useFormHeaderAction(
    !disabled && allowAdd
      ? {
          label: addLabel ?? label,
          title: `${t("limsAddRow")} — ${label}`,
          onClick: focusForm
        }
      : null
  );

  const patchDraft = (patch: Partial<R>) => {
    setEntryError(undefined);
    setEntryDirty(true);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const setCell = (column: SubFormColumn<R>, value: unknown) =>
    patchDraft({
      ...column.onChangeValue?.(draft, value),
      [column.key]: value
    } as Partial<R>);

  const save = () => {
    if (columns.every((column) => isBlank(draft[column.key]))) {
      setEntryError(t("subFormEntryEmpty"));
      return;
    }
    const problem = validateRow?.(draft);
    if (problem) {
      setEntryError(problem);
      return;
    }
    const saved = { ...draft };
    touched.current.add(saved);
    labels.current.set(saved, {
      ...(editIndex !== null ? labels.current.get(rows[editIndex]) : {}),
      ...draftLabels
    });
    onChange(
      editIndex === null
        ? [...rows, saved]
        : rows.map((row, i) => (i === editIndex ? saved : row))
    );
    reset();
  };

  const open = (index: number, readOnly: boolean) => {
    setEntryDirty(false);
    setDraft({ ...rows[index] });
    setDraftLabels({});
    setEditIndex(index);
    setViewing(readOnly);
    setEntryError(undefined);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const remove = (index: number) => {
    if (!touched.current.has(rows[index])) setRemovedSaved((n) => n + 1);
    if (editIndex === index) reset();
    else if (editIndex !== null && editIndex > index)
      setEditIndex(editIndex - 1);
    onChange(rows.filter((_, i) => i !== index));
  };

  const renderInput = (column: SubFormColumn<R>, locked: boolean) => {
    const value = draft[column.key];
    const cellDisabled = locked || Boolean(column.readOnly?.(draft));

    if (column.type === "async-select") {
      const known = column.selectedOption?.(draft);
      return (
        <AsyncSelect
          useOptions={(args) => column.useOptions!(args, draft)}
          value={String(value ?? "")}
          onChange={(next) => setCell(column, next)}
          onChangeOption={(option) => {
            if (!option) return;
            setDraftLabels((prev) => ({
              ...prev,
              [column.key]: option.label
            }));
            if (column.onSelectOption)
              patchDraft({
                ...column.onSelectOption(draft, option),
                [column.key]: option.value
              } as Partial<R>);
          }}
          placeholder={
            column.placeholder ?? t("select", { entity: column.header })
          }
          disabled={cellDisabled}
          initialSelectedOptions={known ? [known] : undefined}
        />
      );
    }

    if (column.type === "select") {
      return (
        <SelectDropdown
          options={column.options ?? []}
          value={String(value ?? "")}
          onChange={(next) => setCell(column, next)}
          placeholder={
            column.placeholder ?? t("select", { entity: column.header })
          }
          disabled={cellDisabled}
          ariaLabel={column.header}
          portal
        />
      );
    }

    if (column.type === "date") {
      return (
        <DateField
          mode="date"
          value={String(value ?? "")}
          onChange={(next) => setCell(column, next)}
          disabled={cellDisabled}
        />
      );
    }

    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          aria-label={column.header}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
          checked={Boolean(value)}
          disabled={cellDisabled}
          onChange={(event) => setCell(column, event.target.checked)}
        />
      );
    }

    return (
      <input
        type={
          column.type === "numeric-text" ? "number" : (column.type ?? "text")
        }
        aria-label={column.header}
        className={inputClasses}
        placeholder={column.placeholder}
        value={String(value ?? "")}
        disabled={cellDisabled}
        onChange={(event) =>
          setCell(
            column,
            column.type === "number"
              ? event.target.value === ""
                ? ""
                : Number(event.target.value)
              : event.target.value
          )
        }
      />
    );
  };

  /** What a saved cell reads as in the table. */
  const display = (row: R, column: SubFormColumn<R>): ReactNode => {
    const value = row[column.key];
    if (column.type === "checkbox") return value ? t("yes") : t("no");
    if (isBlank(value)) return "—";
    if (column.type === "select")
      return (
        column.options?.find((o) => o.value === String(value))?.label ??
        String(value)
      );
    if (column.type === "async-select")
      return (
        labels.current.get(row)?.[column.key] ??
        column.selectedOption?.(row)?.label ??
        String(value)
      );
    if (column.type === "date") return String(value).slice(0, 10);
    return String(value);
  };

  useEntryEditorState({
    unsaved:
      rows.filter((row) => touched.current.has(row)).length + removedSaved,
    pendingEntry: entryDirty && !viewing,
    label,
    focus: () =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    clearEntry: reset
  });

  const tableColumns: EntryTableColumn<R>[] = columns.map((column) => ({
    key: column.key,
    header: column.header,
    tooltip: column.tooltip,
    render: (row) => display(row, column)
  }));

  return (
    <div className="min-w-0 space-y-4">
      {showForm ? (
        <div
          ref={formRef}
          className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <Label className="mb-0">
              {editIndex === null
                ? (addLabel ?? `${t("limsAddRow")} — ${label}`)
                : `${label} ${editIndex + 1}`}
            </Label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((column) => (
              <div key={column.key} className="min-w-0">
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  {column.header}
                  {column.tooltip ? (
                    <HelpTooltip content={column.tooltip} />
                  ) : null}
                </span>
                {renderInput(column, viewing)}
              </div>
            ))}
          </div>
          {entryError ? (
            <p className="mt-2 text-xs text-red-500">{entryError}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-end gap-2">
            {!viewing ? (
              <span className="mr-auto text-xs text-gray-500 dark:text-gray-400">
                {t("entryAddedHint")}
              </span>
            ) : null}
            {editIndex !== null ? (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                {viewing ? t("close") : t("cancel")}
              </Button>
            ) : null}
            {!viewing ? (
              <Button type="button" size="sm" onClick={save}>
                {t("save")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <EntryTable
        label={label}
        columns={tableColumns}
        rows={rows}
        emptyLabel={emptyLabel ?? t("limsNoRows")}
        activeIndex={editIndex}
        onView={(index) => open(index, true)}
        onEdit={disabled ? undefined : (index) => open(index, false)}
        onDelete={disabled ? undefined : remove}
        isUnsaved={(row) => touched.current.has(row)}
      />

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export default SubFormGrid;
