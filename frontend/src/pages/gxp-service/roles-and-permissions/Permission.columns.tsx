import { AvatarCell } from "@/components/data/cells/AvatarCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { GxpPermission } from "./Permission.types";

/** GXP Permission columns — name (avatar) + clamped description. */
export const getPermissionColumns = ({ t }: { t: TFunction }): ColDef<GxpPermission>[] => [
  {
    field: "permissionName",
    headerName: t("permissionName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<GxpPermission>) =>
      params.data ? <AvatarCell label={params.data.permissionName} fallbackInitial="P" /> : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.4,
    minWidth: 320,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpPermission>) => (
      <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
        {params.data?.description || "-"}
      </div>
    )
  }
];
