import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsAliquot } from "./LimsAliquot.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsAliquotColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsAliquot>[] => [
  {
    field: "aliquotSetId",
    headerName: t("limsAliquotSetId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsAliquot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "stockBatch",
    headerName: t("limsStockBatch"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.stockBatch),
    cellRenderer: (params: ICellRendererParams<LimsAliquot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "aliquotsNumber",
    headerName: t("limsAliquotsNumber"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsAliquot>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsAliquot>(t)] : [])
];
