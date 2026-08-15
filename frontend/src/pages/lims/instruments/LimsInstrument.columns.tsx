import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { refLabel } from "@/utils/refLabel";
import type { LimsInstrument } from "./LimsInstrument.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsInstrumentColumns = ({ t }: { t: TFunction }): ColDef<LimsInstrument>[] => [
  {
    field: "instrumentId",
    headerName: t("limsInstrumentId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) =>
      params.data ? (
        <AvatarCell label={String(params.data.name ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    colId: "type",
    headerName: t("limsType"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.type),
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "status",
    headerName: t("status"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.status),
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "location",
    headerName: t("limsLocation"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.location),
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "serialNumber",
    headerName: t("limsSerialNumber"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsInstrument>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
