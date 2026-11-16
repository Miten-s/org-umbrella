import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { fetchLimsLotList } from "@/pages/lims/lots/LimsLot.api";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { removedColumn } from "@/components/data/cells/removedColumn";
import type { LimsBatch, LimsRef } from "./LimsBatch.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsBatchColumns = ({
  t,
  includeRemoved = false
}: {
  t: TFunction;
  /** Adds the Removed column while removed records are listed. */
  includeRemoved?: boolean;
}): ColDef<LimsBatch>[] => [
  {
    field: "batchId",
    headerName: t("limsBatchId"),
    flex: 0.8,
    minWidth: 160,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "batchName",
    headerName: t("limsBatchName"),
    flex: 1.1,
    minWidth: 210,
    cellRenderer: (params: ICellRendererParams<LimsBatch>) =>
      params.data ? (
        <AvatarCell
          label={String(params.data.batchName ?? "")}
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
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "lots",
    headerName: t("limsLots"),
    flex: 1,
    minWidth: 200,
    sortable: false,
    // Array of { id, name } — MIGRATION.md §3-6: multi-item cells use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsBatch>) => (
      <TagListCell<LimsRef>
        items={params.data?.lots}
        totalCount={params.data?.lotsCount}
        getLabel={(item) => refLabel(item)}
        getKey={(item) => item.id}
        tooltipHeaderLabel={t("limsLots")}
        queryKey={["batches", params.data?.id, "lots"]}
        fetchPage={async ({ search, page }) => {
          const result = await fetchLimsLotList(false, {
            page,
            limit: 20,
            search: search || undefined,
            filters: { batchId: params.data?.id }
          });
          return {
            ...result,
            rows: result.rows.map((row) => ({
              id: row.id,
              name: row.lotName || row.lotId || ""
            }))
          };
        }}
      />
    )
  },
  ...(includeRemoved ? [removedColumn<LimsBatch>(t)] : [])
];
