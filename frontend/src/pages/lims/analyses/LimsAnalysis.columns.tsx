import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsAnalysis, LimsRef } from "./LimsAnalysis.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsAnalysisColumns = ({ t }: { t: TFunction }): ColDef<LimsAnalysis>[] => [
  {
    field: "analysisId",
    headerName: t("limsAnalysisId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) =>
      params.data ? (
        <AvatarCell label={String(params.data.name ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    colId: "analysisType",
    headerName: t("limsAnalysisType"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.analysisType),
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "approvalStatus",
    headerName: t("limsApprovalStatus"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.approvalStatus),
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "inspectionPlan",
    headerName: t("limsInspectionPlan"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.inspectionPlan),
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "components",
    headerName: t("limsComponents"),
    flex: 0.7,
    minWidth: 140,
    sortable: false,
    valueGetter: (params) => String(params.data?.components?.length ?? 0),
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsAnalysis>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
