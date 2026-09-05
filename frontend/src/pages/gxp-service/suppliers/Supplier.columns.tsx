import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Supplier } from "./Supplier.types";

interface SupplierColumnCtx {
  t: TFunction;
}

/** Read from ag-grid's `context` (see List's `gridContext`), not closed over here —
 * this keeps columnDefs referentially stable across per-row toggle state changes.
 * Closing over it would give the cellRenderer a new function identity on every
 * toggle click, forcing ag-grid to destroy/recreate the cell instead of just
 * re-rendering it, which kills the Switch's CSS transition. */
interface ToggleContext {
  onToggleStatus: (supplier: Supplier) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

/**
 * Supplier column factory (STANDARDS.md §8). The status column is an interactive
 * enable/disable Switch — the handler is injected via ag-grid context, not closed
 * over, so the columns stay pure and referentially stable.
 */
export const getSupplierColumns = ({ t }: SupplierColumnCtx): ColDef<Supplier>[] => [
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
    // Same escape hatch the actions column uses — without it, clicking the
    // toggle also selects the row (ag-grid's click-to-select runs off its own
    // internal flag, not DOM bubbling, so a plain stopPropagation can't stop it).
    cellRendererParams: { suppressMouseEventHandling: () => true },
    cellRenderer: (params: ICellRendererParams<Supplier>) => {
      const data = params.data;
      if (!data) return null;
      const ctx = params.context as ToggleContext;
      return (
        <StatusToggleCell
          checked={data.status === "enabled"}
          label={data.status === "enabled" ? t("enabled") : t("disabled")}
          disabled={ctx.toggleDisabled}
          loading={ctx.togglingId === data.id}
          onChange={() => ctx.onToggleStatus(data)}
        />
      );
    }
  }
];
