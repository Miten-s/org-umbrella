import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { fetchLimsSampleList } from "@/pages/lims/samples/LimsSample.api";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsLot, LimsRef } from "./LimsLot.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsLotColumns = ({
  t
}: {
  t: TFunction;
}): ColDef<LimsLot>[] => [
  {
    field: "lotId",
    headerName: t("limsLotId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "lotName",
    headerName: t("limsLotName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsLot>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.lotName ?? "")}
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
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "samples",
    headerName: t("limsSamples"),
    flex: 1,
    minWidth: 200,
    sortable: false,
    // Array of { id, name } — MIGRATION.md §3-6: multi-item cells use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsLot>) => (
      <TagListCell<LimsRef>
        items={params.data?.samples}
        totalCount={params.data?.samplesCount}
        getLabel={(item) => refLabel(item)}
        getKey={(item) => item.id}
        tooltipHeaderLabel={t("limsSamples")}
        queryKey={["lots", params.data?.id, "samples"]}
        fetchPage={async ({ search, page }) => {
          const result = await fetchLimsSampleList(false, {
            page,
            limit: 20,
            search: search || undefined,
            filters: { lotId: params.data?.id }
          });
          // Normalize to the same { id, name } shape as the capped preview
          // (`samples`) so one `getLabel` works for both — the full Sample
          // record uses `sampleName`, not `name`.
          return {
            ...result,
            rows: result.rows.map((row) => ({
              id: row.id,
              name: row.sampleName || row.sampleId || ""
            }))
          };
        }}
      />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsLot>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
