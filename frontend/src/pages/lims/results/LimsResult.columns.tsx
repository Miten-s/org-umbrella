import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { lifecycleStatusColumn } from "@/components/data/cells/lifecycleStatusColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsResult } from "./LimsResult.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsResultColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsResult>[] => [
  {
    field: "resultId",
    headerName: t("limsResultId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsResult>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "componentName",
    headerName: t("limsComponentName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsResult>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.componentName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    field: "value",
    headerName: t("limsValue"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsResult>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "test",
    headerName: t("limsTest"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.test),
    cellRenderer: (params: ICellRendererParams<LimsResult>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "sample",
    headerName: t("limsSample"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.sample),
    cellRenderer: (params: ICellRendererParams<LimsResult>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "enteredOn",
    headerName: t("limsEnteredOn"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsResult>) => (
      <DateCell value={params.value} />
    )
  },
  lifecycleStatusColumn<LimsResult>(t),
  ...(includeRemoved ? [removedColumn<LimsResult>(t)] : [])
];
