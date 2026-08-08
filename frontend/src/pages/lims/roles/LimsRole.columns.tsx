import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsRole, LimsRoleEntry, LimsRef } from "./LimsRole.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsRoleColumns = ({ t }: { t: TFunction }): ColDef<LimsRole>[] => [
  {
    field: "roleId",
    headerName: t("limsRoleId"),
    flex: 0.9,
    minWidth: 190,
    cellRenderer: (params: ICellRendererParams<LimsRole>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams<LimsRole>) =>
      params.data ? <AvatarCell label={params.data.name} fallbackInitial="P" /> : null
  },
  {
    colId: "entries",
    headerName: t("limsRoleEntries"),
    flex: 1.4,
    minWidth: 260,
    sortable: false,
    // Rule from MIGRATION.md §3-6: multi-item arrays use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsRole>) => (
      <TagListCell<LimsRoleEntry>
        items={params.data?.entries}
        getLabel={(row) => String(row.entry ?? "")}
        getKey={(row, index) => String(row.entry ?? index)}
        tooltipHeaderLabel={t("limsRoleEntries")}
      />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsRole>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsRole>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
