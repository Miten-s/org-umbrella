import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { DateCell } from "@/components/data/cells/DateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { refLabel } from "@/utils/refLabel";
import type { LimsScheduler } from "./LimsScheduler.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsSchedulerColumns = ({ t }: { t: TFunction }): ColDef<LimsScheduler>[] => [
  {
    field: "schedulerId",
    headerName: t("limsSchedulerId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) =>
      params.data ? (
        <AvatarCell label={String(params.data.name ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    field: "scope",
    headerName: t("limsSchedulerScope"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "plan",
    headerName: t("limsPlan"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "owner",
    headerName: t("limsOwner"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.owner),
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "nextRunDate",
    headerName: t("limsNextRunDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) => (
      <DateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsScheduler>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
