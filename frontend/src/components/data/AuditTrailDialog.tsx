import { Modal } from "@/components/ui/modal";
import { EmptyState, TableSkeleton } from "./TableStates";
import { useTranslation } from "react-i18next";

/**
 * One audit row. `oldValue`/`newValue` are the FULL entity snapshot from the
 * server (see audit-log.model.ts) — not a single field's value — so they're
 * diffed into per-field rows below rather than rendered directly.
 */
export interface LimsAuditEntry {
  id: string;
  uniqueId: string;
  action: "CREATE" | "UPDATE" | "REMOVE" | "RESTORE" | string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  changeReason?: string | null;
  who?: string | null;
  when?: string | null;
}

/** Meta/provenance columns every entity carries — noise in a diff, not a real change. */
const META_FIELDS = new Set([
  "id",
  "_id",
  "createdAt",
  "updatedAt",
  "modifiedOn",
  "modifiedBy",
  "deletedAt",
  "deletedBy",
  "isRemoved",
  "isDeleted"
]);

/** A relation ref ({id, name}/{id, locationName}/...) reads as its label; anything else, as text. */
const readableValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const label =
      obj.name ??
      obj.locationName ??
      obj.userName ??
      obj.supplierName ??
      obj.entry ??
      Object.entries(obj).find(([key]) => key.endsWith("Name"))?.[1];
    return label !== undefined && label !== null ? String(label) : "";
  }
  return String(value);
};

/** One row per record-level audit entry, expanded into a row per field that actually changed. */
interface DiffRow {
  key: string;
  field: string;
  oldValue: string;
  newValue: string;
}

const diffEntry = (entry: LimsAuditEntry): DiffRow[] => {
  const oldObj = entry.oldValue && typeof entry.oldValue === "object" ? (entry.oldValue as Record<string, unknown>) : null;
  const newObj = entry.newValue && typeof entry.newValue === "object" ? (entry.newValue as Record<string, unknown>) : null;

  if (!oldObj && !newObj) {
    return [{ key: entry.id, field: entry.field ?? "", oldValue: readableValue(entry.oldValue), newValue: readableValue(entry.newValue) }];
  }

  const keys = new Set([...Object.keys(oldObj ?? {}), ...Object.keys(newObj ?? {})]);
  const rows: DiffRow[] = [];
  for (const key of keys) {
    if (META_FIELDS.has(key)) continue;
    // `ownerId` is the UUID behind `owner`. When both are in the snapshot the
    // relation already says it in words, so the raw column is duplicate noise.
    if (key.endsWith("Id") && keys.has(key.slice(0, -2))) continue;
    const before = readableValue(oldObj?.[key]);
    const after = readableValue(newObj?.[key]);
    if (before === after) continue;
    rows.push({ key: `${entry.id}-${key}`, field: key, oldValue: before, newValue: after });
  }
  // A create/delete with nothing left to diff still needs one visible row.
  return rows.length ? rows : [{ key: entry.id, field: "", oldValue: "", newValue: "" }];
};

interface AuditTrailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Business key of the record being inspected, shown in the heading. */
  recordLabel?: string;
  entries: LimsAuditEntry[];
  loading?: boolean;
}

const formatWhen = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

/**
 * Read-only audit trail for a single record. Shared by every LIMS module so the
 * compliance view is identical everywhere.
 */
const AuditTrailDialog = ({
  isOpen,
  onClose,
  recordLabel,
  entries,
  loading = false
}: AuditTrailDialogProps) => {
  const { t } = useTranslation();

  const headers = [
    t("limsAuditWho"),
    t("limsAuditWhen"),
    t("limsAuditAction"),
    t("limsAuditField"),
    t("limsAuditOldValue"),
    t("limsAuditNewValue"),
    t("limsAuditWhy")
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 max-h-[90vh] max-w-[1000px] overflow-y-auto dark:bg-gray-900"
    >
      <div className="p-6 dark:text-white">
        <h2 className="mb-4 text-xl font-semibold">
          {t("limsAuditFor", { name: recordLabel ?? "" })}
        </h2>

        {loading ? (
          <TableSkeleton rows={5} columns={headers.length} />
        ) : entries.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {entries.flatMap((entry) =>
                  diffEntry(entry).map((row, index) => (
                    <tr key={row.key}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {index === 0 ? (entry.who ?? "") : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {index === 0 ? formatWhen(entry.when) : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {index === 0 ? entry.action : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {row.field}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {row.oldValue}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {row.newValue}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {index === 0 ? (entry.changeReason ?? "") : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("limsNoAuditEntries")} />
        )}
      </div>
    </Modal>
  );
};

export default AuditTrailDialog;
