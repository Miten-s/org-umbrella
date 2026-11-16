import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import { refLabel } from "@/utils/refLabel";
import type { LimsProject } from "./LimsProject.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsProjectColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsProject>[] => [
  {
    field: "projectId",
    headerName: t("limsProjectId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsProject>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsProject>) =>
      params.data ? (
        <AvatarCell
          label={params.data.name}
          sublabel={params.data.code}
          fallbackInitial="P"
        />
      ) : null
  },
  {
    colId: "customer",
    headerName: t("limsCustomer"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.customer),
    cellRenderer: (params: ICellRendererParams<LimsProject>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "customerContact",
    headerName: t("limsCustomerContact"),
    flex: 0.9,
    minWidth: 180,
    cellRenderer: (params: ICellRendererParams<LimsProject>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "supervisor",
    headerName: t("limsSupervisor"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.supervisor),
    cellRenderer: (params: ICellRendererParams<LimsProject>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsProject>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsProject>(t)] : [])
];
