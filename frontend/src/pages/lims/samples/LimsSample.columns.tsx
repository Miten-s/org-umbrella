import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsSample, LimsRef } from "./LimsSample.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsSampleColumns = ({ t }: { t: TFunction }): ColDef<LimsSample>[] => [
  {
    field: "sampleId",
    headerName: t("limsSampleId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "sampleName",
    headerName: t("limsSampleName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsSample>) =>
      params.data ? (
        <AvatarCell label={String(params.data.sampleName ?? "")} fallbackInitial="•" />
      ) : null
  },
  {
    colId: "project",
    headerName: t("limsProject"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.project),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "sampleType",
    headerName: t("limsSampleType"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.sampleType),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "testGroup",
    headerName: t("limsTestGroup"),
    flex: 0.9,
    minWidth: 170,
    valueGetter: (params) => refLabel(params.data?.testGroup),
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "loginDate",
    headerName: t("limsLoginDate"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsSample>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsSample>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
