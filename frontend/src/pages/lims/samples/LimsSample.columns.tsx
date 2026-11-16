import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { lifecycleStatusColumn } from "@/components/data/cells/lifecycleStatusColumn";
import type { LimsSample, LimsRef } from "./LimsSample.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsSampleColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsSample>[] => [
  {
    field: "sampleId",
    headerName: t("limsSampleId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "sampleName",
    headerName: t("limsSampleName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsSample>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.sampleName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "result",
    headerName: t("limsResult"),
    flex: 0.5,
    minWidth: 110,
    valueGetter: (params) => params.data?.result ?? "-"
  },
  {
    colId: "project",
    headerName: t("limsProject"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.project),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "sampleType",
    headerName: t("limsSampleType"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.sampleType),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "testGroup",
    headerName: t("limsTestGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.testGroup),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "loginDate",
    headerName: t("limsLoginDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <DateCell value={params.value} />
    )
  },
  lifecycleStatusColumn<LimsSample>(t),
  ...(includeRemoved ? [removedColumn<LimsSample>(t)] : [])
];
