import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import type { LimsInspectionPlan, LimsRef } from "./LimsInspectionPlan.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsInspectionPlanColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsInspectionPlan>[] => [
  {
    field: "inspectionId",
    headerName: t("limsInspectionId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.name ?? "")}
          fallbackInitial="•"
        />
      ) : null
  },
  {
    field: "inspectionType",
    headerName: t("limsInspectionType"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "personnel",
    headerName: t("limsPersonnel"),
    flex: 0.7,
    minWidth: 140,
    sortable: false,
    valueGetter: (params) => String(params.data?.personnel?.length ?? 0),
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsInspectionPlan>(t)] : [])
];
