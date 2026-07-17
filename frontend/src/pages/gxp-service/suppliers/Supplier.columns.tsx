import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Supplier } from "./Supplier.types";

interface SupplierColumnCtx {
  t: TFunction;
  /** Enable/disable toggle handler (optimistic mutation lives in the List). */
  onToggleStatus: (supplier: Supplier) => void;
  /** Disable the toggle while any status mutation is in flight (S2). */
  toggleDisabled?: boolean;
  /** id of the row whose status mutation is in flight — shows an inline spinner. */
  togglingId?: string;
}

/**
 * Supplier column factory (STANDARDS.md §8). The status column is an interactive
 * enable/disable Switch — the handler is injected so the columns stay pure.
 */
export const getSupplierColumns = ({
  t,
  onToggleStatus,
  toggleDisabled,
  togglingId
}: SupplierColumnCtx): ColDef<Supplier>[] => [
  {
    field: "supplierName",
    headerName: t("supplierName"),
    flex: 1,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<Supplier>) =>
      params.data ? <AvatarCell label={params.data.supplierName} fallbackInitial="S" /> : null
  },
  {
    field: "product",
    headerName: t("product"),
    flex: 1,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams<Supplier>) => <TruncateCell value={params.value} />
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<Supplier>) => {
      const data = params.data;
      if (!data) return null;
      return (
        <StatusToggleCell
          checked={data.status === "enabled"}
          label={data.status === "enabled" ? t("enabled") : t("disabled")}
          disabled={toggleDisabled}
          loading={togglingId === data.id}
          onChange={() => onToggleStatus(data)}
        />
      );
    }
  }
];
