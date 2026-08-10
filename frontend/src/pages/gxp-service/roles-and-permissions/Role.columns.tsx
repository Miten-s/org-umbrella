import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { getRolePermissionNames, type GxpRole } from "./Role.types";

/** GXP Role columns — name (avatar) + permission tags with "+N" overflow. */
export const getRoleColumns = ({ t }: { t: TFunction }): ColDef<GxpRole>[] => [
  {
    field: "name",
    headerName: t("roleName"),
    flex: 0.9,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<GxpRole>) =>
      params.data ? <AvatarCell label={params.data.name} fallbackInitial="R" /> : null
  },
  {
    field: "permissions",
    headerName: t("permissions"),
    flex: 1.4,
    minWidth: 320,
    sortable: false,
    valueGetter: ({ data }) => (data ? getRolePermissionNames(data).join(", ") : ""),
    cellRenderer: (params: ICellRendererParams<GxpRole>) => {
      const names = params.data ? getRolePermissionNames(params.data) : [];
      return (
        <TagListCell
          items={names}
          getLabel={(name) => name}
          tooltipHeaderLabel={`Permissions (${names.length})`}
        />
      );
    }
  }
];
