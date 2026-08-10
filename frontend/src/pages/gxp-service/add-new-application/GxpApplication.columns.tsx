import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { GxpApplication } from "./GxpApplication.types";

const refName = (v: any, key: string): string =>
  v && typeof v === "object" ? String(v[key] ?? v.name ?? "") : "";

interface Ctx {
  t: TFunction;
  onToggleStatus: (app: GxpApplication) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getApplicationColumns = ({ t, onToggleStatus, toggleDisabled, togglingId }: Ctx): ColDef<GxpApplication>[] => [
  {
    field: "applicationName",
    headerName: t("applicationName"),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<GxpApplication>) =>
      params.data ? <AvatarCell label={params.data.applicationName} fallbackInitial="A" /> : null
  },
  {
    field: "applicationType",
    headerName: t("applicationType"),
    flex: 0,
    minWidth: 130,
    cellRenderer: (params: ICellRendererParams<GxpApplication>) => <TruncateCell value={params.data?.applicationType} />
  },
  {
    field: "applicationEnvironment",
    headerName: t("applicationEnvironment"),
    flex: 1,
    minWidth: 180,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpApplication>) => (
      <TruncateCell value={refName(params.data?.applicationEnvironment, "environmentName")} />
    )
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpApplication>) => {
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
