import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { COMPONENT_ENTITIES } from "@/pages/lims/analyses/componentTypes";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import type { LimsEntityTemplate } from "./LimsEntityTemplate.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsEntityTemplateColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsEntityTemplate>[] => [
  {
    field: "entityTemplateId",
    headerName: t("limsEntityTemplateId"),
    flex: 0.9,
    minWidth: 190,
    cellRenderer: (params: ICellRendererParams<LimsEntityTemplate>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1.2,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsEntityTemplate>) =>
      params.data ? (
        <AvatarCell label={params.data.name} fallbackInitial="E" />
      ) : null
  },
  {
    colId: "entity",
    headerName: t("limsTable"),
    flex: 0.8,
    minWidth: 170,
    sortable: false,
    valueGetter: (params) =>
      COMPONENT_ENTITIES.find((e) => e.value === params.data?.entity)?.label ??
      params.data?.entity,
    cellRenderer: (params: ICellRendererParams<LimsEntityTemplate>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => params.data?.group?.name ?? "",
    cellRenderer: (params: ICellRendererParams<LimsEntityTemplate>) => (
      <TruncateCell value={params.value} />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsEntityTemplate>(t)] : [])
];
