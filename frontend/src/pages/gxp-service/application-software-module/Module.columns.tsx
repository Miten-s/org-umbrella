import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { getModuleApplicationName, type ApplicationSoftwareModule } from "./Module.types";

interface ModuleColumnCtx {
  t: TFunction;
  onToggleStatus: (module: ApplicationSoftwareModule) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getModuleColumns = ({ t, onToggleStatus, toggleDisabled, togglingId }: ModuleColumnCtx): ColDef<ApplicationSoftwareModule>[] => [
  {
    field: "moduleName",
    headerName: t("moduleName"),
    flex: 1,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) =>
      params.data ? <AvatarCell label={params.data.moduleName} fallbackInitial="M" /> : null
  },
  {
    field: "application",
    headerName: t("application"),
    flex: 1,
    minWidth: 200,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => (
      <TruncateCell value={params.data ? getModuleApplicationName(params.data) : ""} />
    )
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => {
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
