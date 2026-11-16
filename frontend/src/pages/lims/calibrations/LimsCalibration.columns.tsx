import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import type { LimsCalibration, LimsRef } from "./LimsCalibration.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsCalibrationColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsCalibration>[] => [
  {
    field: "calibrationId",
    headerName: t("limsCalibrationId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "calibrationName",
    headerName: t("limsCalibrationName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.calibrationName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "instrument",
    headerName: t("limsInstrument"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.instrument),
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "plan",
    headerName: t("limsPlan"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "status",
    headerName: t("status"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.status),
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "nextMaintenanceDate",
    headerName: t("limsNextMaintenanceDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsCalibration>) => (
      <DateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsCalibration>(t)] : [])
];
