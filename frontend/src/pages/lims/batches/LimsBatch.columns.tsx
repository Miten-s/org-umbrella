import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsBatch, LimsRef } from "./LimsBatch.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsBatchColumns = ({ t }: { t: TFunction }): ColDef<LimsBatch>[] => [
  {
    field: "batchId",
    headerName: t("limsBatchId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "batchName",
    headerName: t("limsBatchName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) =>
      params.data ? (
        <AvatarCell label={String(params.data.batchName ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "lots",
    headerName: t("limsLots"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
