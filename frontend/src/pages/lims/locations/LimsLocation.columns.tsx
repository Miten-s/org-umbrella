import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsLocation, LimsRef } from "./LimsLocation.types";

/** Label for a relation the server returns nested as `{ id, name }`. */
const refLabel = (ref: LimsRef | string | null | undefined): string => {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.locationName ?? ref.name ?? "";
};

/** Column factory (STANDARDS.md §8) — no inline cell JSX in module files. */
export const getLimsLocationColumns = ({ t }: { t: TFunction }): ColDef<LimsLocation>[] => [
  {
    field: "locationId",
    headerName: t("limsLocationId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsLocation>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "locationName",
    headerName: t("name"),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<LimsLocation>) =>
      params.data ? <AvatarCell label={params.data.locationName} fallbackInitial="L" /> : null
  },
  {
    colId: "locationType",
    headerName: t("limsLocationType"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.locationType),
    cellRenderer: (params: ICellRendererParams<LimsLocation>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "parentLocation",
    headerName: t("limsParentLocation"),
    flex: 0.9,
    minWidth: 180,
    valueGetter: (params) => refLabel(params.data?.parentLocation),
    cellRenderer: (params: ICellRendererParams<LimsLocation>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "subLocations",
    headerName: t("limsSubLocations"),
    flex: 1,
    minWidth: 200,
    sortable: false,
    // Rule from MIGRATION.md §3-6: any multi-item array uses TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsLocation>) => (
      <TagListCell<LimsRef>
        items={params.data?.subLocations}
        getLabel={(item) => refLabel(item)}
        getKey={(item) => item.id}
        tooltipHeaderLabel={t("limsSubLocations")}
      />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsLocation>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsLocation>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
