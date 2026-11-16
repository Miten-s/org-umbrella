import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import {
  getLimsRolePermissionNames,
  type LimsRole,
  type LimsRef
} from "./LimsRole.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsRoleColumns = ({
  t,
  permissionLabels = {},
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
  /** Permission code → display name from the catalogue; codes are never shown as-is. */
  permissionLabels?: Record<string, string>;
}): ColDef<LimsRole>[] => [
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
      params.data ? (
        <AvatarCell label={params.data.name} fallbackInitial="P" />
      ) : null
  },
  {
    colId: "permissions",
    headerName: t("permissions"),
    flex: 1.4,
    minWidth: 260,
    sortable: false,
    valueGetter: ({ data }) =>
      data
        ? getLimsRolePermissionNames(data)
            .map((code) => permissionLabels[code] ?? code)
            .join(", ")
        : "",
    // Rule from MIGRATION.md §3-6: multi-item arrays use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsRole>) => {
      const names = params.data
        ? getLimsRolePermissionNames(params.data).map(
            (code) => permissionLabels[code] ?? code
          )
        : [];
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
  ...(includeRemoved ? [removedColumn<LimsRole>(t)] : [])
];
