import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AgGridReact, type CustomCellEditorProps } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellValueChangedEvent,
  type GridApi,
  type ColDef,
  type ColGroupDef
} from "ag-grid-community";
import { useTranslation } from "react-i18next";
import AsyncSelect from "@/components/data/AsyncSelect";
import Button from "@/components/ui/button/Button";
import DateField from "@/components/common/form/input/DateField";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { createAgTableTheme } from "@/components/common/table/tableTheme";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/lib/toast";
import { useCloseEditorOnScroll } from "./useCloseEditorOnScroll";
import { useWarnBeforeUnload } from "./useWarnBeforeUnload";
import { useSpreadsheet } from "./spreadsheet";
import TextCellEditor from "./TextCellEditor";
import LongTextCellEditor from "./LongTextCellEditor";
import { finishPopupEdit, useEscapeCancelsEdit } from "./finishPopupEdit";
import type { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { AsyncOption } from "@/lib/query/listTypes";

ModuleRegistry.registerModules([AllCommunityModule]);

export type OptionsHook = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) => ReturnType<typeof useAsyncOptions>;

/** One editable field of the record, shown as a column. */
export interface WorkspaceField<R> {
  /** Payload key the value is saved under. */
  key: string;
  label: string;
  /** Column group header, e.g. "General". */
  section?: string;
  type: "text" | "textarea" | "date" | "ref";
  required?: boolean;
  pinned?: boolean;
  width?: number;
  /** Editable value — an id for refs, `YYYY-MM-DD` for dates. */
  get: (record: R) => string;
  /** Initial label for a ref's value. */
  refLabel?: (record: R) => string;
  useOptions?: OptionsHook;
  /** Longest value the server accepts — shown as a counter in long-text editors. */
  maxLength?: number;
  /** Server search behind the dropdown — resolves a pasted name to its record. */
  search?: (args: {
    search: string;
    page: number;
  }) => Promise<{ options: AsyncOption[] }>;
}

export interface WorkspaceChange<R> {
  record: R;
  /** Every field's current value. */
  values: Record<string, string>;
  /** Keys whose value differs from what was loaded. */
  changed: string[];
}

interface BulkWorkspaceProps<R extends { id: string }> {
  /** Left side of the top bar — the page's Back, title and tabs, shared across its tabs. */
  header: ReactNode;
  records: R[];
  fields: WorkspaceField<R>[];
  /** Read-only identifier column pinned first, e.g. Sample ID. */
  idColumn: { label: string; get: (record: R) => string };
  readOnly: boolean;
  saving?: boolean;
  onSave: (changes: WorkspaceChange<R>[]) => void;
  /** Rows not saved yet (Create/Copy): Save needs only valid rows, not edits. */
  newRecords?: boolean;
  /** Create: rows the user never touched are skipped on Save instead of blocking it. */
  skipUntouched?: boolean;
  /** Record ids touched outside the grid (e.g. tests picked for them). */
  touchedIds?: Set<string>;
  /** Extra read-only columns, e.g. a Tests summary. */
  extraColumns?: ColDef[];
  /** Changes held outside the grid (e.g. picked tests) — they count toward Save. */
  extraChanges?: number;
  actions?: ReactNode;
  /** Fires when the grid gains or loses unsaved edits. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Live current values, for callers that label things by them (e.g. a sample's name). */
  valuesRef?: React.MutableRefObject<Map<string, Record<string, string>>>;
  /** The page owns Save: hides this grid's own Save/Discard and summary. */
  hideSave?: boolean;
  /** Rendered last in the toolbar, e.g. the page's shared Save. */
  trailing?: ReactNode;
  /** Live counts for a page-level Save. */
  onStatus?: (status: WorkspaceStatus) => void;
  /** Lets the page collect the rows to save and discard edits. */
  handleRef?: React.MutableRefObject<WorkspaceHandle<R> | null>;
}

export interface WorkspaceStatus {
  changedCells: number;
  invalidCount: number;
  /** Rows Save would send (Create skips untouched ones). */
  savedRows: number;
  skippedRows: number;
}

export interface WorkspaceHandle<R> {
  collect: () => WorkspaceChange<R>[];
  discard: () => void;
  /** Commits a cell still being edited. */
  commit: () => void;
}

interface RowData {
  id: string;
  __id: string;
  __changed: Set<string>;
  __touched: boolean;
  __differs: Set<string>;
  __invalid: Set<string>;
  [key: string]: unknown;
}

/** dd-mm-yyyy, dd/mm/yyyy or dd.mm.yyyy (or already YYYY-MM-DD) → YYYY-MM-DD. */
const toIsoDate = (value: string) => {
  const dayFirst = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value.trim());
  if (dayFirst)
    return `${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`;
  return value.trim();
};

const formatDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

/** A dropdown cell editor: the field's own server-searched picker, opened straight away. */
export const RefEditor = (
  props: CustomCellEditorProps & {
    useOptions: OptionsHook;
    remember: (option: AsyncOption) => void;
    initialLabel?: string;
  }
) => {
  useEscapeCancelsEdit(props);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLButtonElement>("button")?.click();
  }, []);
  const value = String(props.value ?? "");
  return (
    <div
      ref={box}
      className="w-80 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-900"
    >
      <AsyncSelect
        useOptions={props.useOptions}
        value={value}
        initialSelectedOptions={
          value && props.initialLabel
            ? [{ value, label: props.initialLabel }]
            : undefined
        }
        onChange={(next) => {
          props.onValueChange(next);
          finishPopupEdit(props);
        }}
        onChangeOption={(option) => option && props.remember(option)}
      />
    </div>
  );
};

/**
 * Full-page bulk View/Edit: one row per record, one column per field. Edits stay local until
 * Save; changed cells, cells that differ from the other records, and missing required values
 * are marked, and "Only differences" hides fields that are the same everywhere.
 */
function BulkWorkspace<R extends { id: string }>({
  header,
  records,
  fields,
  idColumn,
  readOnly,
  saving = false,
  onSave,
  newRecords = false,
  skipUntouched = false,
  touchedIds,
  extraColumns = [],
  extraChanges = 0,
  actions,
  valuesRef,
  onDirtyChange,
  hideSave = false,
  trailing,
  onStatus,
  handleRef
}: BulkWorkspaceProps<R>) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const closeEditorOnScroll = useCloseEditorOnScroll();
  const sheet = useSpreadsheet();
  const gridApi = useRef<GridApi | null>(null);
  const gridTheme = useMemo(
    // Column lines: in an editable sheet every cell should read as its own box.
    () =>
      createAgTableTheme({ theme, rowHeight: 44 }).withParams({
        columnBorder: true
      }),
    [theme]
  );

  const initial = useMemo(
    () =>
      new Map(
        records.map((r) => [
          r.id,
          Object.fromEntries(fields.map((f) => [f.key, f.get(r)]))
        ])
      ),
    [records, fields]
  );
  const [values, setValues] = useState(initial);
  useEffect(() => setValues(initial), [initial]);
  useEffect(() => {
    if (valuesRef) valuesRef.current = values;
  }, [values, valuesRef]);

  // Ref labels by field + id, seeded from the records and grown as options are picked.
  const [labels, setLabels] = useState(() => new Map<string, string>());
  useEffect(() => {
    const next = new Map<string, string>();
    for (const r of records)
      for (const f of fields)
        if (f.type === "ref" && f.refLabel) {
          const id = f.get(r);
          if (id) next.set(`${f.key}:${id}`, f.refLabel(r));
        }
    setLabels((prev) => new Map([...next, ...prev]));
  }, [records, fields]);
  const remember = (key: string, option: AsyncOption) =>
    setLabels((prev) =>
      new Map(prev).set(`${key}:${option.value}`, option.label)
    );

  const [onlyDiff, setOnlyDiff] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState("");
  const [bulkValue, setBulkValue] = useState("");

  const { differing, varying } = useMemo(() => {
    const result = new Map<string, Set<string>>();
    const varies = new Set<string>();
    if (records.length < 2) return { differing: result, varying: varies };
    for (const f of fields) {
      const counts = new Map<string, number>();
      for (const r of records) {
        const v = values.get(r.id)?.[f.key] ?? "";
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      if (counts.size < 2) continue;
      varies.add(f.key);
      // All-different values (e.g. names) have no common value to differ from.
      const [common, shared] = [...counts].sort((a, b) => b[1] - a[1])[0];
      if (shared < 2) continue;
      for (const r of records)
        if ((values.get(r.id)?.[f.key] ?? "") !== common) {
          const set = result.get(r.id) ?? new Set<string>();
          set.add(f.key);
          result.set(r.id, set);
        }
    }
    return { differing: result, varying: varies };
  }, [records, fields, values]);

  const rowData = useMemo<RowData[]>(
    () =>
      records.map((r) => {
        const current = values.get(r.id) ?? {};
        const before = initial.get(r.id) ?? {};
        const changed = new Set(
          fields
            .filter((f) => current[f.key] !== before[f.key])
            .map((f) => f.key)
        );
        const touched = changed.size > 0 || Boolean(touchedIds?.has(r.id));
        return {
          ...current,
          id: r.id,
          __id: idColumn.get(r),
          __record: r,
          __changed: changed,
          __touched: touched,
          __differs: differing.get(r.id) ?? new Set(),
          // An untouched new row is skipped on Save, so it can't be "missing" anything.
          __invalid:
            skipUntouched && !touched
              ? new Set<string>()
              : new Set(
                  fields
                    .filter((f) => f.required && !current[f.key]?.trim())
                    .map((f) => f.key)
                )
        };
      }),
    [
      records,
      values,
      initial,
      fields,
      differing,
      idColumn,
      skipUntouched,
      touchedIds
    ]
  );

  const changedRows = rowData.filter((row) => row.__changed.size);
  const changedCells = changedRows.reduce(
    (sum, row) => sum + row.__changed.size,
    0
  );
  useEffect(
    () => onDirtyChange?.(changedCells > 0),
    [changedCells, onDirtyChange]
  );
  useWarnBeforeUnload(changedCells + extraChanges > 0);
  const savedRows = skipUntouched
    ? rowData.filter((row) => row.__touched)
    : rowData;
  const invalidCount = rowData.reduce(
    (sum, row) => sum + row.__invalid.size,
    0
  );
  const sameEverywhere = (key: string) => !varying.has(key);

  // A pasted dropdown value arrives as its name; only names already shown on this page can be
  // matched to their record — anything else is left for the picker.
  const noMatch = (f: WorkspaceField<R>, text: string) =>
    toast(t("bulkPasteNoMatch", { value: text, field: f.label }), "info", {
      id: `paste-${f.key}`
    });

  // A pasted dropdown value arrives as its name. Names already on the page resolve at once;
  // others are looked up with the dropdown's own server search and filled in when found.
  const toStored = (
    f: WorkspaceField<R>,
    text: string,
    rowId: string
  ): string | null => {
    if (f.type === "date") {
      if (!text) return "";
      const iso = toIsoDate(text);
      const year = Number(iso.slice(0, 4));
      // A typo like 3412 would otherwise be stored without a word.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || year < 1900 || year > 2100) {
        toast(t("bulkDateInvalid", { value: text }), "error", {
          id: `date-${f.key}`
        });
        return null;
      }
      return iso;
    }
    if (f.type !== "ref" || !text) return text;
    if (labels.has(`${f.key}:${text}`)) return text;
    const wanted = text.trim().toLowerCase();
    const prefix = `${f.key}:`;
    for (const [key, label] of labels)
      if (key.startsWith(prefix) && label.toLowerCase() === wanted)
        return key.slice(prefix.length);
    if (!f.search) {
      noMatch(f, text);
      return null;
    }
    f.search({ search: text.trim(), page: 1 })
      .then(({ options }) => {
        const hit = options.find((o) => o.label.toLowerCase() === wanted);
        if (!hit) return noMatch(f, text);
        remember(f.key, hit);
        setValues((prev) =>
          new Map(prev).set(rowId, {
            ...(prev.get(rowId) ?? {}),
            [f.key]: hit.value
          })
        );
      })
      .catch(() => noMatch(f, text));
    return null;
  };

  const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
    const toColumn = (f: WorkspaceField<R>): ColDef => ({
      field: f.key,
      headerName: f.required && !readOnly ? `${f.label} *` : f.label,
      pinned: f.pinned ? "left" : undefined,
      width: f.width ?? (f.type === "textarea" ? 260 : 180),
      hide: onlyDiff && !f.pinned && sameEverywhere(f.key),
      editable: !readOnly,
      // One click opens the cell with a caret and its text selected: typing replaces it.
      singleClickEdit: true,
      // Pasted text arrives as a label or a typed date; stored as the id / YYYY-MM-DD.
      valueSetter: (p) => {
        const stored = toStored(
          f,
          String(p.newValue ?? ""),
          (p.data as RowData).id
        );
        if (stored === null) return false;
        (p.data as RowData)[f.key] = stored;
        return true;
      },
      valueFormatter: (p) => {
        const v = String(p.value ?? "");
        if (!v) return "";
        if (f.type === "ref") return labels.get(`${f.key}:${v}`) ?? v;
        if (f.type === "date") return formatDate(v);
        return v;
      },
      // An empty editable cell shows what it takes, so it doesn't look like dead space.
      cellRenderer: (p: { value?: unknown; valueFormatted?: string | null }) =>
        p.valueFormatted || String(p.value ?? "") ? (
          f.type === "textarea" ? (
            // First line only; the whole note on hover.
            <span title={String(p.value ?? "")}>
              {String(p.value ?? "").split("\n")[0]}
              {String(p.value ?? "").includes("\n") ? " …" : ""}
            </span>
          ) : (
            (p.valueFormatted ?? String(p.value ?? ""))
          )
        ) : readOnly ? (
          ""
        ) : (
          <span className="text-gray-300 dark:text-gray-600">
            {f.type === "ref"
              ? t("bulkHintSelect")
              : f.type === "date"
                ? "dd-mm-yyyy"
                : ""}
          </span>
        ),
      cellClassRules: {
        "bg-error-50 dark:bg-error-500/10": (p) =>
          (p.data as RowData)?.__invalid.has(f.key),
        // On new rows everything is "changed", so only differences and gaps are marked.
        "bg-brand-50 dark:bg-brand-500/10 font-medium": (p) =>
          !newRecords &&
          (p.data as RowData)?.__changed.has(f.key) &&
          !(p.data as RowData)?.__invalid.has(f.key),
        "bg-warning-50 dark:bg-warning-500/10": (p) =>
          (p.data as RowData)?.__differs.has(f.key) &&
          (newRecords || !(p.data as RowData)?.__changed.has(f.key)) &&
          !(p.data as RowData)?.__invalid.has(f.key)
      },
      ...(f.type === "textarea"
        ? {
            cellEditor: LongTextCellEditor,
            cellEditorPopup: true,
            // Under the cell, so the record being edited stays in view.
            cellEditorPopupPosition: "under" as const,
            // While editing, Enter belongs to the text (new line; Ctrl+Enter saves), not the grid.
            suppressKeyboardEvent: (p: {
              editing: boolean;
              event: KeyboardEvent;
            }) => p.editing && p.event.key === "Enter",
            cellEditorParams: (p: { data?: RowData }) => ({
              label: f.label,
              recordLabel: p.data?.__id,
              maxLength: f.maxLength
            })
          }
        : f.type === "date"
          ? { cellDataType: "dateString", cellEditor: "agDateStringCellEditor" }
          : f.type === "ref"
            ? {
                cellEditor: RefEditor,
                cellEditorPopup: true,
                cellEditorParams: (p: { value: unknown }) => ({
                  useOptions: f.useOptions,
                  remember: (option: AsyncOption) => remember(f.key, option),
                  initialLabel: labels.get(`${f.key}:${String(p.value ?? "")}`)
                })
              }
            : { cellEditor: TextCellEditor })
    });

    const idCol: ColDef = {
      colId: "__id",
      field: "__id",
      headerName: idColumn.label,
      pinned: "left",
      width: 170,
      editable: false,
      cellClass: "font-medium"
    };
    const columns: (ColDef | ColGroupDef)[] = [
      idCol,
      ...fields.filter((f) => f.pinned).map(toColumn),
      ...extraColumns
    ];
    const sections = new Map<string, WorkspaceField<R>[]>();
    for (const f of fields.filter((x) => !x.pinned)) {
      const key = f.section ?? "";
      sections.set(key, [...(sections.get(key) ?? []), f]);
    }
    for (const [section, list] of sections) {
      if (section)
        columns.push({ headerName: section, children: list.map(toColumn) });
      else columns.push(...list.map(toColumn));
    }
    return columns;
    // `sameEverywhere` reads `varying`; recomputed with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fields,
    readOnly,
    onlyDiff,
    labels,
    varying,
    extraColumns,
    idColumn,
    newRecords
  ]);

  const onCellValueChanged = (event: CellValueChangedEvent<RowData>) => {
    const key = event.colDef.field;
    if (!key || !event.data) return;
    const id = event.data.id;
    const value = String(event.newValue ?? "");
    setValues((prev) => {
      const next = new Map(prev);
      next.set(id, { ...(next.get(id) ?? {}), [key]: value });
      return next;
    });
  };

  const bulkFieldDef = fields.find((f) => f.key === bulkField);
  const applyToSelected = (value: string) => {
    if (!bulkFieldDef) return;
    setValues((prev) => {
      const next = new Map(prev);
      for (const id of selectedIds)
        next.set(id, { ...(next.get(id) ?? {}), [bulkFieldDef.key]: value });
      return next;
    });
  };

  const collect = () =>
    records
      .filter((record) => savedRows.some((row) => row.id === record.id))
      .map((record) => ({
        record,
        values: values.get(record.id) ?? {},
        changed: [
          ...(rowData.find((row) => row.id === record.id)?.__changed ?? [])
        ]
      }));
  const save = () => onSave(collect());
  if (handleRef)
    handleRef.current = {
      collect,
      discard: () => setValues(initial),
      commit: sheet.commit
    };
  useEffect(() => {
    onStatus?.({
      changedCells,
      invalidCount,
      savedRows: savedRows.length,
      skippedRows: records.length - savedRows.length
    });
  }, [onStatus, changedCells, invalidCount, savedRows.length, records.length]);

  const bulkEditor = () => {
    if (!bulkFieldDef) return null;
    if (bulkFieldDef.type === "ref" && bulkFieldDef.useOptions)
      return (
        <div className="w-64">
          <AsyncSelect
            useOptions={bulkFieldDef.useOptions}
            value={bulkValue}
            onChange={setBulkValue}
            onChangeOption={(option) =>
              option && remember(bulkFieldDef.key, option)
            }
          />
        </div>
      );
    if (bulkFieldDef.type === "date")
      return (
        <div className="w-48">
          <DateField
            mode="date"
            value={bulkValue}
            onChange={(v) => setBulkValue(v ?? "")}
          />
        </div>
      );
    return (
      <input
        value={bulkValue}
        onChange={(e) => setBulkValue(e.target.value)}
        className="h-10.5 w-64 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700"
      />
    );
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[32rem] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {header}
        <label
          data-tour="only-diff"
          className="ml-auto flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          {t("limsOnlyDifferences")}
        </label>
        {actions}
        {!readOnly && !hideSave ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {invalidCount
                ? t("bulkMissingRequired", { count: invalidCount })
                : skipUntouched
                  ? t("bulkCreateSummary", {
                      count: savedRows.length,
                      skipped: records.length - savedRows.length
                    })
                  : newRecords
                    ? t("bulkNewRows", { count: records.length })
                    : t("bulkChangesSummary", {
                        count: changedCells + extraChanges,
                        rows: changedRows.length
                      })}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={!changedCells || saving}
              onClick={() => setValues(initial)}
            >
              {t("bulkDiscard")}
            </Button>
            <Button
              type="button"
              onClick={save}
              loading={saving}
              disabled={
                saving ||
                invalidCount > 0 ||
                !savedRows.length ||
                (!newRecords && !(changedCells + extraChanges))
              }
            >
              {t("bulkSaveAll")}
            </Button>
          </>
        ) : null}
        {trailing}
      </div>

      {!readOnly ? (
        <div
          data-tour="fill-bar"
          className="flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {selectedIds.length ? (
            <>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {t("bulkFillSelected", { count: selectedIds.length })}
              </span>
              <div className="w-56">
                <SelectDropdown
                  options={[
                    { value: "", label: t("bulkPickField") },
                    ...fields.map((f) => ({ value: f.key, label: f.label }))
                  ]}
                  value={bulkField}
                  onChange={(value) => {
                    setBulkField(value);
                    setBulkValue("");
                  }}
                  placeholder={t("bulkPickField")}
                  ariaLabel={t("bulkPickField")}
                  portal
                />
              </div>
              {bulkEditor()}
              <Button
                type="button"
                size="sm"
                onClick={() => applyToSelected(bulkValue)}
                disabled={!bulkFieldDef || !bulkValue}
              >
                {t("bulkApply")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyToSelected("")}
                disabled={!bulkFieldDef}
              >
                {t("bulkClearValue")}
              </Button>
              <button
                type="button"
                onClick={() => gridApi.current?.deselectAll()}
                className="text-xs text-gray-500 hover:underline"
              >
                {t("bulkUnselect")}
              </button>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {t("bulkFillHint")}
            </span>
          )}
          <span
            data-tour="legend"
            className="ml-auto flex items-center gap-3 text-xs text-gray-500"
          >
            <span className="inline-block h-3 w-3 rounded-sm bg-brand-100" />{" "}
            {t("bulkLegendChanged")}
            <span className="inline-block h-3 w-3 rounded-sm bg-warning-100" />{" "}
            {t("bulkLegendDiffers")}
            <span className="inline-block h-3 w-3 rounded-sm bg-error-100" />{" "}
            {t("bulkLegendMissing")}
          </span>
        </div>
      ) : null}

      <div
        data-tour="grid"
        className="min-h-0 flex-1"
        {...sheet.containerProps}
      >
        <AgGridReact<RowData>
          onGridReady={(e) => {
            sheet.onGridReady(e);
            gridApi.current = e.api;
          }}
          theme={gridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          getRowId={(p) => p.data.id}
          rowSelection={readOnly ? undefined : { mode: "multiRow" }}
          selectionColumnDef={{ pinned: "left", width: 48 }}
          onSelectionChanged={(e) =>
            setSelectedIds(e.api.getSelectedRows().map((row) => row.id))
          }
          onCellValueChanged={onCellValueChanged}
          {...closeEditorOnScroll}
          undoRedoCellEditing
          // Spreadsheet entry: Enter saves the cell and moves down to the next row.
          enterNavigatesVertically
          enterNavigatesVerticallyAfterEdit
          stopEditingWhenCellsLoseFocus={false}
          defaultColDef={{
            resizable: true,
            sortable: false,
            suppressMovable: true
          }}
        />
      </div>
    </div>
  );
}

export default BulkWorkspace;
