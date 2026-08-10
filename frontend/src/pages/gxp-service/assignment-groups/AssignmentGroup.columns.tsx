import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { AssignmentGroup } from "./AssignmentGroup.types";

interface Ctx {
  t: TFunction;
  onToggleStatus: (group: AssignmentGroup) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getAssignmentGroupColumns = ({ t, onToggleStatus, toggleDisabled, togglingId }: Ctx): ColDef<AssignmentGroup>[] => [
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
    cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => {
      const data = params.data;
      if (!data) return null;
      return (
        <StatusToggleCell
          checked={!!data.isActive}
          label={data.isActive ? t("active") : "Inactive"}
          disabled={toggleDisabled}
          loading={togglingId === data.id}
          onChange={() => onToggleStatus(data)}
        />
      );
    }
  }
];
