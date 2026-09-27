import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import { DateCell } from "@/components/data/cells/DateCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { fetchLimsCalibrationList } from "@/pages/lims/calibrations/LimsCalibration.api";
import type { LimsCalibration } from "@/pages/lims/calibrations/LimsCalibration.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Lead time in days — how early "due soon" starts before the next due date. */
const leadDays = (row: LimsCalibration) => {
  const value = Number(row.leadTimeValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  switch (row.leadTimeUnit) {
    case "Hours":
      return value / 24;
    case "Min":
      return value / (24 * 60);
    case "Second":
      return value / (24 * 60 * 60);
    default:
      return value;
  }
};

type DueState = "overdue" | "dueSoon" | "inDate" | "notScheduled";

const dueState = (row: LimsCalibration, today: Date): DueState => {
  if (!row.nextMaintenanceDate) return "notScheduled";
  const due = new Date(row.nextMaintenanceDate);
  if (Number.isNaN(due.getTime())) return "notScheduled";
  const daysLeft = (due.getTime() - today.getTime()) / MS_PER_DAY;
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= leadDays(row)) return "dueSoon";
  return "inDate";
};

const DUE_PILL: Record<
  DueState,
  { key: string; tone: "error" | "warning" | "success" | "neutral" }
> = {
  overdue: { key: "limsCalOverdue", tone: "error" },
  dueSoon: { key: "limsCalDueSoon", tone: "warning" },
  inDate: { key: "limsCalInDate", tone: "success" },
  notScheduled: { key: "limsCalNotScheduled", tone: "neutral" }
};

/** Read-only list of an instrument's calibrations — they're owned and edited in the
 * Calibrations module; this is the instrument-logbook view an analyst or auditor checks. */
const InstrumentCalibrations = ({ instrumentId }: { instrumentId: string }) => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["limsCalibration", "byInstrument", instrumentId],
    queryFn: ({ signal }) =>
      fetchLimsCalibrationList(
        false,
        {
          page: 1,
          limit: 100,
          sortBy: "nextMaintenanceDate",
          sortDir: "asc",
          filters: { instrumentId }
        },
        signal
      )
  });

  const rows = data?.rows ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const headers = [
    t("limsCalibrationId"),
    t("limsCalibrationName"),
    t("limsCalibrationType"),
    t("limsPlan"),
    t("status"),
    t("limsLastDone"),
    t("limsNextDue"),
    ""
  ];

  return (
    <div className="min-w-0">
      <Label tooltip={t("limsInstrumentCalibrationsHint")}>
        {t("limsCalibrations")}
      </Label>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {rows.length ? (
              rows.map((row) => {
                const pill = DUE_PILL[dueState(row, today)];
                return (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.calibrationId}
                    </td>
                    <td className="px-3 py-2">{row.calibrationName}</td>
                    <td className="px-3 py-2">
                      {row.calibrationType?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">{row.plan || "—"}</td>
                    <td className="px-3 py-2">{row.status?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <DateCell value={row.lastMaintenanceDate} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <DateCell value={row.nextMaintenanceDate} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill label={t(pill.key)} tone={pill.tone} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  {isLoading
                    ? t("limsLoadingCalibrations")
                    : isError
                      ? t("limsCalibrationsLoadFailed")
                      : t("limsNoCalibrations")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstrumentCalibrations;
