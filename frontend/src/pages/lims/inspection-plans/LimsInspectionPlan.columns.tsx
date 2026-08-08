import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsInspectionPlan, LimsRef } from "./LimsInspectionPlan.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsInspectionPlanColumns = ({ t }: { t: TFunction }): ColDef<LimsInspectionPlan>[] => [
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
        <AvatarCell label={String(params.data.name ?? "")} fallbackInitial="•" />
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
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsInspectionPlan>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
