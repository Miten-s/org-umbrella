import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { AssignmentGroup } from "./AssignmentGroup.types";

interface Ctx {
  t: TFunction;
}

/** Read from ag-grid's `context` (see List's `gridContext`), not closed over here —
 * this keeps columnDefs referentially stable across per-row toggle state changes.
 * Closing over it would give the cellRenderer a new function identity on every
 * toggle click, forcing ag-grid to destroy/recreate the cell instead of just
 * re-rendering it, which kills the Switch's CSS transition. */
interface ToggleContext {
  onToggleStatus: (group: AssignmentGroup) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getAssignmentGroupColumns = ({ t }: Ctx): ColDef<AssignmentGroup>[] => [
  {
    field: "groupName",
    headerName: t("groupName"),
    flex: 1,
    minWidth: 220,
    cellRenderer: (params: ICellRendererParams<AssignmentGroup>) =>
      params.data ? <AvatarCell label={params.data.groupName} fallbackInitial="G" /> : null
  },
  {
    field: "manager",
    headerName: t("manager"),
    flex: 1,
    minWidth: 180,
    sortable: false,
    valueGetter: ({ data }) => data?.manager?.name ?? "-",
    cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => (
      <TruncateCell value={params.data?.manager?.name} />
    )
  },
  {
    field: "members",
    headerName: t("members"),
    flex: 1.2,
    minWidth: 200,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => (
      <TagListCell
        items={params.data?.members ?? []}
        getLabel={(m) => m.name}
        getKey={(m) => m.userId}
        tooltipHeaderLabel={`Members (${params.data?.members?.length ?? 0})`}
      />
    )
  },
  {
    field: "isActive",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    // Same escape hatch the actions column uses — without it, clicking the
    // toggle also selects the row (ag-grid's click-to-select runs off its own
    // internal flag, not DOM bubbling, so a plain stopPropagation can't stop it).
    cellRendererParams: { suppressMouseEventHandling: () => true },
    cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => {
      const data = params.data;
      if (!data) return null;
      const ctx = params.context as ToggleContext;
      return (
        <StatusToggleCell
          checked={!!data.isActive}
          label={data.isActive ? t("active") : "Inactive"}
          disabled={ctx.toggleDisabled}
          loading={ctx.togglingId === data.id}
          onChange={() => ctx.onToggleStatus(data)}
        />
      );
    }
  }
];
