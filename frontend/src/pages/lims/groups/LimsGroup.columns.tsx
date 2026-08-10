import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsGroup, LimsGroupRef } from "./LimsGroup.types";

const refLabel = (ref: LimsGroupRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsGroupColumns = ({ t }: { t: TFunction }): ColDef<LimsGroup>[] => [
  {
    field: "groupId",
    headerName: t("limsGroupId"),
    flex: 0.9,
    minWidth: 170,
    cellRenderer: (params: ICellRendererParams<LimsGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsGroup>) =>
      params.data ? <AvatarCell label={params.data.name} fallbackInitial="G" /> : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<LimsGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "parentGroup",
    headerName: t("limsParentGroup"),
    flex: 0.9,
    minWidth: 180,
    // Relations arrive as objects — expose the label so ag-grid can sort and
    // export it, rather than inferring a formatter for `[object Object]`.
    valueGetter: (params) => refLabel(params.data?.parentGroup),
    cellRenderer: (params: ICellRendererParams<LimsGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "ownedBy",
    headerName: t("limsOwnedBy"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.ownedBy),
    cellRenderer: (params: ICellRendererParams<LimsGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsGroup>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
