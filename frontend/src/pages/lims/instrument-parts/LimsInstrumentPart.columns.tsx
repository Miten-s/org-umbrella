import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsInstrumentPart } from "./LimsInstrumentPart.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsInstrumentPartColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsInstrumentPart>[] => [
  {
    field: "partId",
    headerName: t("limsPartId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "partName",
    headerName: t("limsPartName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.partName ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "instrument",
    headerName: t("limsInstrument"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.instrument),
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "status",
    headerName: t("status"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.status),
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "location",
    headerName: t("limsLocation"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.location),
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "serialNumber",
    headerName: t("limsSerialNumber"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInstrumentPart>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsInstrumentPart>(t)] : [])
];
