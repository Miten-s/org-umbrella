import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsRef, LimsCustomer } from "./LimsCustomer.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsCustomerColumns = ({ t }: { t: TFunction }): ColDef<LimsCustomer>[] => [
  {
    field: "customerId",
    headerName: t("limsCustomerId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "customerName",
    headerName: t("limsCustomerName"),
    flex: 1.1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) =>
      params.data ? (
        <AvatarCell
          label={params.data.customerName}
          sublabel={params.data.email}
          fallbackInitial="S"
        />
      ) : null
  },
  {
    field: "contactName",
    headerName: t("limsContactName"),
    flex: 0.9,
    minWidth: 180,
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "contactPhone",
    headerName: t("limsContactPhone"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "rating",
    headerName: t("limsRating"),
    flex: 0.7,
    minWidth: 140,
    valueGetter: (params) => refLabel(params.data?.rating),
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsCustomer>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
