import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsRef, LimsUser } from "./LimsUser.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsUserColumns = ({ t }: { t: TFunction }): ColDef<LimsUser>[] => [
  {
    colId: "user",
    headerName: t("user"),
    flex: 1.1,
    minWidth: 210,
    valueGetter: (params) => params.data?.user?.name ?? "",
    cellRenderer: (params: ICellRendererParams<LimsUser>) =>
      params.data ? (
        <AvatarCell label={String(params.value ?? "")} fallbackInitial="U" showAvatar />
      ) : null
  },
  {
    colId: "roles",
    headerName: t("limsRoles"),
    flex: 1.2,
    minWidth: 220,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TagListCell<LimsRef>
        items={params.data?.roles}
        getLabel={(item) => refLabel(item)}
        getKey={(item) => item.id}
        tooltipHeaderLabel={t("limsRoles")}
      />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "location",
    headerName: t("limsLocation"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.location),
    cellRenderer: (params: ICellRendererParams<LimsUser>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "trainingCompleted",
    headerName: t("limsTrainingCompleted"),
    flex: 0.7,
    minWidth: 150,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsUser>) =>
      params.data?.trainingCompleted ? (
        <StatusPill label={t("yes")} tone="success" />
      ) : (
        <StatusPill label={t("no")} tone="neutral" />
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
