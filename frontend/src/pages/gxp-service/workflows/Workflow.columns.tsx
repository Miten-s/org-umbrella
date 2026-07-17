import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { StatusToggleCell } from "@/components/data/cells/StatusToggleCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Workflow } from "./Workflow.types";

interface WorkflowColumnCtx {
  t: TFunction;
  onToggleStatus: (workflow: Workflow) => void;
  toggleDisabled?: boolean;
  togglingId?: string;
}

export const getWorkflowColumns = ({ t, onToggleStatus, toggleDisabled, togglingId }: WorkflowColumnCtx): ColDef<Workflow>[] => [
  {
    field: "workflowName",
    headerName: t("workflowName"),
    flex: 1,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<Workflow>) =>
      params.data ? <AvatarCell label={params.data.workflowName} fallbackInitial="W" /> : null
  },
  {
    field: "numberOfLevels",
    headerName: t("numberOfLevels"),
    flex: 0,
    minWidth: 160,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<Workflow>) => (
      <TruncateCell value={params.value != null ? String(params.value) : ""} />
    )
  },
  {
    field: "status",
    headerName: t("status"),
    flex: 0,
    minWidth: 170,
    maxWidth: 190,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<Workflow>) => {
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
