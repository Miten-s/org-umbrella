import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { GxpServiceRequest } from "./GxpServiceRequest.types";

const appName = (a: any): string =>
  a && typeof a === "object" ? String(a.applicationName ?? a.name ?? "") : String(a ?? "");

/** SR columns — id, short description, application, priority, status (read-only). */
export const getServiceRequestColumns = ({ t }: { t: TFunction }): ColDef<GxpServiceRequest>[] => [
  {
    field: "serviceRequestId",
    headerName: t("identity", { defaultValue: "Identity" }),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<GxpServiceRequest>) =>
      params.data ? <AvatarCell label={params.data.serviceRequestId || "-"} fallbackInitial="SR" /> : null
  },
  {
    field: "shortDescription",
    headerName: t("shortDescription"),
    flex: 1.2,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<GxpServiceRequest>) => <TruncateCell value={params.data?.shortDescription} />
  },
  {
    field: "application",
    headerName: t("gxpApplications"),
    flex: 1,
    minWidth: 180,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<GxpServiceRequest>) => (
      <TruncateCell value={appName(params.data?.application) || params.data?.applicationName} />
    )
  },
  {
    field: "priority",
    headerName: t("priority"),
    flex: 0,
    minWidth: 120,
    cellRenderer: (params: ICellRendererParams<GxpServiceRequest>) => <TruncateCell value={params.data?.priority} />
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 150,
    cellRenderer: (params: ICellRendererParams<GxpServiceRequest>) => {
      const s = params.data?.status;
      if (!s) return <TruncateCell value="-" />;
      const tone = s.startsWith("Closed") ? "neutral" : s === "New" ? "success" : "warning";
      return <StatusPill label={s} tone={tone} center={false} />;
    }
  }
];
