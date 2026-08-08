import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsLot, LimsRef } from "./LimsLot.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsLotColumns = ({ t }: { t: TFunction }): ColDef<LimsLot>[] => [
  {
    field: "lotId",
    headerName: t("limsLotId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "lotName",
    headerName: t("limsLotName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsLot>) =>
      params.data ? (
        <AvatarCell label={String(params.data.lotName ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "samples",
    headerName: t("limsSamples"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsLot>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
