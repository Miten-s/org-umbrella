import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { StatusPill } from "./StatusPill";

/** A record's own lifecycle status (e.g. Active / Cancelled) — not whether it was removed. */
export const lifecycleStatusColumn = <T extends { status?: string | null }>(
  t: TFunction
): ColDef<T> => ({
  colId: "status",
  headerName: t("status"),
  flex: 0.6,
  minWidth: 130,
  sortable: false,
  valueGetter: (params) => params.data?.status ?? "",
  cellRenderer: (params: ICellRendererParams<T>) =>
    params.value ? (
      <StatusPill
        label={String(params.value)}
        tone={params.value === "Cancelled" ? "error" : "success"}
      />
    ) : (
      "—"
    )
});
