import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { COMPONENT_ENTITIES } from "@/pages/lims/analyses/componentTypes";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsEntityTemplate } from "./LimsEntityTemplate.types";

/** Column factory (STANDARDS.md §8). */
export const getLimsEntityTemplateColumns = ({
  t
}: {
  t: TFunction;
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
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsEntityTemplate>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
