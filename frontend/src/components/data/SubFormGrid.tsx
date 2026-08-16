import Button from "@/components/ui/button/Button";
import Label from "@/components/common/form/Label";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { PlusIcon, TrashBinIcon } from "@/public/icons";
import { useTranslation } from "react-i18next";

export type SubFormColumnType = "text" | "number" | "date" | "checkbox" | "select";

export interface SubFormColumn<R> {
  key: keyof R & string;
  header: string;
  type?: SubFormColumnType;
  /** Required when `type` is "select". */
  options?: { label: string; value: string }[];
  placeholder?: string;
  /** Tailwind width class, e.g. "w-40". Defaults to an even share. */
  className?: string;
}

export interface SubFormGridProps<R extends Record<string, unknown>> {
  label: string;
  columns: SubFormColumn<R>[];
  rows: R[];
  onChange: (rows: R[]) => void;
  /** Factory for a blank row; defaults to `{}`. */
  newRow?: () => R;
  /** View mode — renders read-only, no add/remove. */
  disabled?: boolean;
  /** Off for lists that can only be pruned (e.g. uploaded attachments). */
  allowAdd?: boolean;
  addLabel?: string;
  emptyLabel?: string;
  error?: string;
  /**
   * How rows are laid out.
   *
   * "table" is one row per record, which stops working past a handful of
   * columns: Analysis Components has thirteen, so every input collapses to a
   * few characters wide behind a horizontal scrollbar. "stacked" gives each
   * record a card whose fields wrap onto as many lines as they need, so the
   * inputs keep a usable width and nothing scrolls sideways.
   *
   * "auto" (the default) picks stacked past `STACK_THRESHOLD` columns, so
   * narrow grids are unaffected.
   */
  layout?: "table" | "stacked" | "auto";
}

/** Columns beyond which a table row stops being readable. */
const STACK_THRESHOLD = 6;

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";

/**
 * Repeatable rows inside a form — the LIMS spec's "sub form" grids: analysis
 * components, specification limits, stock parameters, consumption records,
 * maintenance history, role entries, test lists, aliquots.
 *
 * This is FORM STATE, not a data table: no server paging, sorting or selection.
 * Rows live in the parent form's state and are handed to the payload on submit;
 * use `DataTable` for anything server-driven. Wide grids scroll horizontally
 * inside their own container so the modal never grows a horizontal scrollbar.
 */
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
  layout = "auto"
}: SubFormGridProps<R>) {
  const { t } = useTranslation();
  const editable = !disabled;
  const stacked = layout === "stacked" || (layout === "auto" && columns.length > STACK_THRESHOLD);

  const updateCell = (rowIndex: number, key: string, value: unknown) =>
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)));

  const addRow = () => onChange([...rows, newRow ? newRow() : ({} as R)]);

  const removeRow = (rowIndex: number) =>
    onChange(rows.filter((_, index) => index !== rowIndex));

  const renderCell = (row: R, rowIndex: number, column: SubFormColumn<R>) => {
    const value = row[column.key];

    if (column.type === "select") {
      return (
        <SelectDropdown
          options={column.options ?? []}
          value={String(value ?? "")}
          onChange={(next) => updateCell(rowIndex, column.key, next)}
          placeholder={column.placeholder ?? t("select", { entity: column.header })}
          disabled={disabled}
          ariaLabel={column.header}
          // Rendered through a portal: a grid cell sits inside the table's
          // overflow container and the modal's, either of which would clip the
          // menu open downwards.
          portal
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
          disabled={disabled}
          onChange={(event) => updateCell(rowIndex, column.key, event.target.checked)}
        />
      );
    }

    return (
      <input
        type={column.type ?? "text"}
        aria-label={column.header}
        className={inputClasses}
        placeholder={column.placeholder}
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(event) =>
          updateCell(
            rowIndex,
            column.key,
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

  /**
   * One card per record, fields wrapping onto as many lines as they need. The
   * column header becomes each field's own label, since there is no header row
   * to carry it.
   */
  const renderStacked = () => (
    <div className="space-y-3">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {`${label} ${rowIndex + 1}`}
            </span>
            {editable ? (
              <button
                type="button"
                aria-label={`${t("delete")} ${rowIndex + 1}`}
                onClick={() => removeRow(rowIndex)}
                className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <TrashBinIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((column) => (
              <div key={column.key} className={`min-w-0 ${column.className ?? ""}`}>
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  {column.header}
                </span>
                {renderCell(row, rowIndex, column)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label className="mb-0">{label}</Label>
        {editable && allowAdd ? (
          <Button size="sm" variant="outline" type="button" startIcon={<PlusIcon className="h-4 w-4" />} onClick={addRow}>
            {addLabel ?? t("limsAddRow")}
          </Button>
        ) : null}
      </div>

      {stacked ? (
        rows.length ? (
          renderStacked()
        ) : (
          <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {emptyLabel ?? t("limsNoRows")}
          </div>
        )
      ) : (
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
              {editable ? <th scope="col" className="w-16 px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 align-top">
                      {renderCell(row, rowIndex, column)}
                    </td>
                  ))}
                  {editable ? (
                    <td className="px-3 py-2 text-right align-top">
                      <button
                        type="button"
                        aria-label={`${t("delete")} ${rowIndex + 1}`}
                        onClick={() => removeRow(rowIndex)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (editable ? 1 : 0)}
                  className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {emptyLabel ?? t("limsNoRows")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export default SubFormGrid;
