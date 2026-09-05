import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Environment } from "./Environment.types";

interface EnvironmentColumnCtx {
  t: TFunction;
}

/** Read from ag-grid's `context` (see List's `gridContext`), not closed over here —
 * this keeps columnDefs referentially stable across per-row toggle state changes.
 * Closing over it would give the cellRenderer a new function identity on every
 * toggle click, forcing ag-grid to destroy/recreate the cell instead of just
 * re-rendering it, which kills the Switch's CSS transition. */
interface ToggleContext {
  onToggleStatus: (environment: Environment) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

/** Column factory (STANDARDS.md §8) — preserves the pre-migration columns, plus the
 * interactive enable/disable Switch every other GXP module already has. */
export const getEnvironmentColumns = ({ t }: EnvironmentColumnCtx): ColDef<Environment>[] => [
  {
    field: "environmentName",
    headerName: t("environmentName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<Environment>) =>
      params.data ? <AvatarCell label={params.data.environmentName} fallbackInitial="E" /> : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 280,
    cellRenderer: (params: ICellRendererParams<Environment>) => <TruncateCell value={params.value} />
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
    cellRenderer: (params: ICellRendererParams<Environment>) => {
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
