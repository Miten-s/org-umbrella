import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { getLimsRolePermissionNames, type LimsRole, type LimsRef } from "./LimsRole.types";

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
    colId: "permissions",
    headerName: t("permissions"),
    flex: 1.4,
    minWidth: 260,
    sortable: false,
    valueGetter: ({ data }) => (data ? getLimsRolePermissionNames(data).join(", ") : ""),
    // Rule from MIGRATION.md §3-6: multi-item arrays use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsRole>) => {
      const names = params.data ? getLimsRolePermissionNames(params.data) : [];
      return (
        <TagListCell
          items={names}
          getLabel={(name) => name}
          tooltipHeaderLabel={`${t("permissions")} (${names.length})`}
        />
      );
    }
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
