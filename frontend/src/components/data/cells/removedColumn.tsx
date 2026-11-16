import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import { StatusPill } from "./StatusPill";

/** Marks removed records — added to a list only while "Show removed" is on. A record's own
 * status (if the module has one) is a separate column. */
export const removedColumn = <T extends { isRemoved?: boolean }>(
  t: TFunction
): ColDef<T> => ({
  field: "isRemoved" as ColDef<T>["field"],
  headerName: t("limsRemoved"),
  flex: 0.5,
  minWidth: 120,
  sortable: false,
  cellRenderer: (params: ICellRendererParams<T>) =>
    params.data?.isRemoved ? (
      <StatusPill label={t("limsRemoved")} tone="error" />
    ) : null
});
