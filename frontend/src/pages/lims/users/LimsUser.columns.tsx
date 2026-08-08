import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsUser, LimsRef } from "./LimsUser.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsUserColumns = ({ t }: { t: TFunction }): ColDef<LimsUser>[] => [
  {
    field: "userId",
    headerName: t("limsUserId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsUser>) =>
      params.data ? (
        <AvatarCell label={String(params.data.name ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    field: "email",
    headerName: t("email"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "location",
    headerName: t("limsLocation"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.location),
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsUser>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
