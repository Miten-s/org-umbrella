import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { GxpUser } from "./GxpUser.types";

interface GxpUserColumnCtx {
  t: TFunction;
  onToggleStatus: (user: GxpUser) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getGxpUserColumns = ({ t, onToggleStatus, toggleDisabled, togglingId }: GxpUserColumnCtx): ColDef<GxpUser>[] => [
  {
    field: "user",
    headerName: t("userName"),
    flex: 1,
    minWidth: 220,
    valueGetter: ({ data }) => data?.user?.name ?? "",
    cellRenderer: (params: ICellRendererParams<GxpUser>) =>
      params.data ? <AvatarCell label={params.data.user.name || "-"} fallbackInitial="U" showAvatar /> : null
  },
  {
    field: "userType",
    headerName: t("userType"),
    flex: 0,
    minWidth: 140,
    cellRenderer: (params: ICellRendererParams<GxpUser>) => <TruncateCell value={params.data?.userType} />
  },
  {
    field: "roles",
    headerName: t("gxpAppRoles"),
    flex: 1.2,
    minWidth: 240,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpUser>) => (
      <TagListCell
        items={params.data?.roles ?? []}
        getKey={(r) => r.id}
        getLabel={(r) => r.name}
        tooltipHeaderLabel={`Roles (${params.data?.roles?.length ?? 0})`}
      />
    )
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1,
    minWidth: 200,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpUser>) => <TruncateCell value={params.data?.description} />
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpUser>) => {
      const data = params.data;
      if (!data) return null;
      return (
        <StatusToggleCell
          checked={data.status === "enabled"}
          label={data.status === "enabled" ? t("enabled") : t("disabled")}
          disabled={toggleDisabled}
          loading={togglingId === data.id}
          onChange={() => onToggleStatus(data)}
        />
      );
    }
  }
];
