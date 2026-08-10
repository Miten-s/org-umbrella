import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsParameter, LimsRef } from "./LimsParameter.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsParameterColumns = ({
  t
}: {
  t: TFunction;
}): ColDef<LimsParameter>[] => [
  {
    field: "parameterId",
    headerName: t("limsParameterId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsParameter>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "parameterName",
    headerName: t("limsParameterName"),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsParameter>) =>
      params.data ? <AvatarCell label={params.data.parameterName} fallbackInitial="P" /> : null
  },
  {
    colId: "parameterType",
    headerName: t("limsParameterType"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.parameterType),
    cellRenderer: (params: ICellRendererParams<LimsParameter>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "defaultValue",
    headerName: t("limsDefaultValue"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsParameter>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "unit",
    headerName: t("limsUnit"),
    flex: 0.6,
    minWidth: 120,
    cellRenderer: (params: ICellRendererParams<LimsParameter>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsParameter>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
