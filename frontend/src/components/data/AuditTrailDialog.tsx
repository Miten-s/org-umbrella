import { Modal } from "@/components/ui/modal";
import { EmptyState, TableSkeleton } from "./TableStates";
import { useTranslation } from "react-i18next";

/**
 * One audit row. GxP requires who / when / old / new / why plus the record's
 * business key — see LIMS_BACKEND_SPEC.md §4.
 */
export interface LimsAuditEntry {
  id: string;
  uniqueId: string;
  action: "CREATE" | "UPDATE" | "REMOVE" | "RESTORE" | string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changeReason?: string | null;
  who?: string | null;
  when?: string | null;
}

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
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {entry.who ?? ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatWhen(entry.when)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {entry.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {entry.field ?? ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {entry.oldValue ?? ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {entry.newValue ?? ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {entry.changeReason ?? ""}
                    </td>
                  </tr>
                ))}
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
