import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { refLabel } from "@/utils/refLabel";
import type { LimsStockBatch } from "./LimsStockBatch.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsStockBatchColumns = ({ t }: { t: TFunction }): ColDef<LimsStockBatch>[] => [
  {
    field: "stockBatchId",
    headerName: t("limsStockBatchId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "stock",
    headerName: t("limsStock"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.stock),
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "status",
    headerName: t("status"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.status),
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "supplier",
    headerName: t("limsSupplier"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.supplier),
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "currentAmount",
    headerName: t("limsCurrentAmount"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "expiryDate",
    headerName: t("limsExpiryDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) => (
      <DateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsStockBatch>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
