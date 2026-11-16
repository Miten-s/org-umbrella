import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import type { LimsSpecification, LimsRef } from "./LimsSpecification.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsSpecificationColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsSpecification>[] => [
  {
    field: "specId",
    headerName: t("limsSpecId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsSpecification>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsSpecification>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.name ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsSpecification>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "limits",
    headerName: t("limsLimits"),
    flex: 0.7,
    minWidth: 140,
    sortable: false,
    valueGetter: (params) => String(params.data?.limits?.length ?? 0),
    cellRenderer: (params: ICellRendererParams<LimsSpecification>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsSpecification>(t)] : [])
];
