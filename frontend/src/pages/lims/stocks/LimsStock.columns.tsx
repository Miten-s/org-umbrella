import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsStock } from "./LimsStock.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsStockColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsStock>[] => [
  {
    field: "stockId",
    headerName: t("limsStockId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStock>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "stockName",
    headerName: t("limsStockName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsStock>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.stockName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "stockType",
    headerName: t("limsStockType"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.stockType),
    cellRenderer: (params: ICellRendererParams<LimsStock>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "defaultLocation",
    headerName: t("limsDefaultLocation"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.defaultLocation),
    cellRenderer: (params: ICellRendererParams<LimsStock>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "unit",
    headerName: t("limsUnit"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStock>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "preferredSupplier",
    headerName: t("limsPreferredSupplier"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.preferredSupplier),
    cellRenderer: (params: ICellRendererParams<LimsStock>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsStock>(t)] : [])
];
