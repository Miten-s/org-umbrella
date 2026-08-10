import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsStudy, LimsRef } from "./LimsStudy.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsStudyColumns = ({ t }: { t: TFunction }): ColDef<LimsStudy>[] => [
  {
    field: "studyId",
    headerName: t("limsStudyId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsStudy>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsStudy>) =>
      params.data ? (
        <AvatarCell label={params.data.name} sublabel={params.data.studyCode} fallbackInitial="P" />
      ) : null
  },
  {
    colId: "project",
    headerName: t("limsProject"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.project),
    cellRenderer: (params: ICellRendererParams<LimsStudy>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "studyCode",
    headerName: t("limsStudyCode"),
    flex: 0.9,
    minWidth: 180,
    cellRenderer: (params: ICellRendererParams<LimsStudy>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "supervisor",
    headerName: t("limsSupervisor"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.supervisor),
    cellRenderer: (params: ICellRendererParams<LimsStudy>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsStudy>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsStudy>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
