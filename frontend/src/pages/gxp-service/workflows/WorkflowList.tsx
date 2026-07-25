import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  workflowKeys,
  useBulkCloneWorkflow,
  useBulkDeleteWorkflow,
  useCreateWorkflow,
  useToggleWorkflowStatus,
  useUpdateWorkflow
} from "./Workflow.queries";
import { fetchWorkflowList } from "./Workflow.api";
import { getWorkflowColumns } from "./Workflow.columns";
import WorkflowForm, { type WorkflowFormMode } from "./WorkflowForm";
import type { Workflow, WorkflowPayload } from "./Workflow.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Workflow module (GXP) — migrated via MIGRATION.md checklist (Track A batch). */
const WorkflowList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Workflow | null>(null);
  const [formMode, setFormMode] = useState<WorkflowFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<Workflow>({
    entity: "workflow",
    queryKey: workflowKeys.all,
    fetchList: fetchWorkflowList
  });

  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const bulkClone = useBulkCloneWorkflow();
  const bulkDelete = useBulkDeleteWorkflow();
  const toggleStatus = useToggleWorkflowStatus();
  const busy =
    createWorkflow.isPending ||
    updateWorkflow.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getWorkflowColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (workflow) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(workflow);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: WorkflowFormMode, workflow: Workflow | null) => {
    setFormMode(mode);
    setActive(workflow);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: WorkflowPayload) => {
    if (active) {
      await updateWorkflow.mutateAsync({ id: active.id, payload });
    } else {
      await createWorkflow.mutateAsync(payload);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy workflows" : "Copy workflow"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_WORKFLOW,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete workflows" : "Delete workflow"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_WORKFLOW,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.workflowName)
              : []
          );
        }
      }
    ],
    [bulkClone, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Workflow>[]>(
    () => [
      {
        key: "view",
        label: "View workflow",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_WORKFLOW,
        onClick: (workflow) => openForm("view", workflow)
      },
      {
        key: "edit",
        label: "Edit workflow",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_WORKFLOW,
        onClick: (workflow) => openForm("edit", workflow)
      },
      {
        key: "clone",
        label: "Copy workflow",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_WORKFLOW,
        onClick: (workflow) => bulkClone.mutate({ mode: "ids", ids: [workflow.id] })
      },
      {
        key: "delete",
        label: "Delete workflow",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_WORKFLOW,
        onClick: (workflow) => {
          setPendingDelete({ mode: "ids", ids: [workflow.id] });
          setDeleteCount(1);
          setDeleteNames([workflow.workflowName]);
        }
      }
    ],
    [bulkClone, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Workflow>
        table={table}
        columnDefs={columnDefs}
        tableName={t("gxpWorkflows")}
        searchPlaceholder="Search workflows…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("workflow") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_WORKFLOW,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No workflows found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <WorkflowForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createWorkflow.isPending || updateWorkflow.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} workflows?`
            : "Are you sure you want to delete this workflow?"
        }
        onConfirm={async () => {
          if (pendingDelete) {
            await bulkDelete.mutateAsync(pendingDelete);
            table.clearSelection();
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
};

export default WorkflowList;
