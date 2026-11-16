import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { lifecycleStatusColumn } from "@/components/data/cells/lifecycleStatusColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsTest } from "./LimsTest.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsTestColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsTest>[] => [
  {
    field: "testId",
    headerName: t("limsTestId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsTest>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "testName",
    headerName: t("limsTestName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsTest>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.testName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "sample",
    headerName: t("limsSample"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.sample),
    cellRenderer: (params: ICellRendererParams<LimsTest>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "analysis",
    headerName: t("limsAnalysis"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.analysis),
    cellRenderer: (params: ICellRendererParams<LimsTest>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "instrument",
    headerName: t("limsInstrument"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.instrument),
    cellRenderer: (params: ICellRendererParams<LimsTest>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "loginDate",
    headerName: t("limsLoginDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsTest>) => (
      <DateCell value={params.value} />
    )
  },
  lifecycleStatusColumn<LimsTest>(t),
  ...(includeRemoved ? [removedColumn<LimsTest>(t)] : [])
];
