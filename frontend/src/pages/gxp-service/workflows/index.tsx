import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useModal } from "@/hooks/useModal";
import { useServerPagination } from "@/hooks/useServerPagination";
import { toast } from "@/lib/toast";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  bulkDeleteWorkflows,
  bulkDuplicateWorkflows,
  createWorkflow,
  disableWorkflow,
  enableWorkflow,
  getWorkflows,
  updateWorkflow
} from "@/services/gxp.service";
import { Workflow } from "@/types/common.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateWorkflowModal from "./CreateWorkflowModal";

type WorkflowModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "W";

const Workflows = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const paginatedWorkflows = useServerPagination<Workflow>({
    dataKeys: ["workflows", "data"],
    dependencies: [reFetch],
    errorMessage: "Failed to load workflows. Please try again.",
    fetchPage: getWorkflows
  });
  const workflows = paginatedWorkflows.rows;
  const setWorkflows = paginatedWorkflows.setRows;
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [workflowModalMode, setWorkflowModalMode] =
    useState<WorkflowModalMode>("create");
  const [pendingDeleteWorkflows, setPendingDeleteWorkflows] = useState<
    Workflow[]
  >([]);

  const handleCloseModal = () => {
    closeModal();
    setActiveWorkflow(null);
    setWorkflowModalMode("create");
  };

  const handleSave = async (data: Partial<Workflow>) => {
    try {
      if (activeWorkflow) {
        await updateWorkflow(activeWorkflow._id, data);
      } else {
        await createWorkflow(data);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast("Failed to save workflow. Please try again.", "error");
    }
  };

  const handleStatusChange = useCallback(
    async (workflow: Workflow) => {
      const nextStatus = workflow.status === "enabled" ? "disabled" : "enabled";

      setWorkflows((prev) =>
        prev.map((item) =>
          item._id === workflow._id ? { ...item, status: nextStatus } : item
        )
      );

      try {
        if (nextStatus === "enabled") {
          await enableWorkflow(workflow._id);
        } else {
          await disableWorkflow(workflow._id);
        }
      } catch (error) {
        console.error("Workflow status update failed:", error);
        setWorkflows((prev) =>
          prev.map((item) =>
            item._id === workflow._id
              ? { ...item, status: workflow.status }
              : item
          )
        );
      }
    },
    [setWorkflows]
  );

  const handleDuplicateWorkflows = useCallback(
    async (rows: Workflow[]) => {
      if (!rows.length) {
        return;
      }

      try {
        await bulkDuplicateWorkflows(
          rows.map((workflow) => workflow._id),
          { silent: true }
        );
        toast(
          rows.length > 1
            ? `${rows.length} workflows copied successfully.`
            : "Workflow copied successfully.",
          "success"
        );
        setReFetch(!reFetch);
      } catch (error) {
        console.error("Error copying workflows:", error);
        toast("Failed to copy selected workflows. Please try again.", "error");
      }
    },
    [reFetch, setReFetch]
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteWorkflows.length) {
      return;
    }

    try {
      await bulkDeleteWorkflows(
        pendingDeleteWorkflows.map((workflow) => workflow._id),
        { silent: true }
      );
      toast(
        pendingDeleteWorkflows.length > 1
          ? `${pendingDeleteWorkflows.length} workflows deleted successfully.`
          : "Workflow deleted successfully.",
        "success"
      );

      setPendingDeleteWorkflows([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast("Failed to delete selected workflows. Please try again.", "error");
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<Workflow>[]>(
    () => [
      {
        key: "create-workflow",
        label: t("create", { entity: t("gxpWorkflows") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveWorkflow(null);
          setWorkflowModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_WORKFLOW,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<Workflow>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy workflows" : "Copy workflow",
        icon: CopyIcon,
        variant: "outline",
        onClick: handleDuplicateWorkflows
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete workflows" : "Delete workflow",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_WORKFLOW,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteWorkflows(selectedRows)
      }
    ],
    [handleDuplicateWorkflows]
  );

  const rowActions = useMemo<AppDataTableRowAction<Workflow>[]>(
    () => [
      {
        key: "view",
        label: "View workflow",
        tooltip: "View workflow",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_WORKFLOW,
        onClick: (workflow) => {
          setActiveWorkflow(workflow);
          setWorkflowModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit workflow",
        tooltip: "Edit workflow",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_WORKFLOW,
        onClick: (workflow) => {
          setActiveWorkflow(workflow);
          setWorkflowModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy workflow",
        tooltip: "Copy workflow",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (workflow) => handleDuplicateWorkflows([workflow])
      },
      {
        key: "delete",
        label: "Delete workflow",
        tooltip: "Delete workflow",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_WORKFLOW,
        tone: "danger",
        onClick: (workflow) => setPendingDeleteWorkflows([workflow])
      }
    ],
    [handleDuplicateWorkflows, openModal]
  );

  const columnDefs = useMemo<ColDef<Workflow>[]>(
    () => [
      {
        field: "workflowName",
        flex: 1,
        headerName: t("workflowName"),
        minWidth: 240,
        cellRenderer: (params: ICellRendererParams<Workflow>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.workflowName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.workflowName}
              </div>
            </div>
          );
        }
      },
      {
        field: "numberOfLevels",
        flex: 0,
        headerName: t("numberOfLevels"),
        minWidth: 140,
        maxWidth: 170,
        valueGetter: ({ data }) =>
          data?.numberOfLevels ?? data?.levels?.length ?? 0,
        cellRenderer: (params: ICellRendererParams<Workflow>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<Workflow>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="py-1.5">
              <Switch
                label={data.status === "enabled" ? t("enabled") : t("disabled")}
                checked={data.status === "enabled"}
                onChange={() => handleStatusChange(data)}
              />
            </div>
          );
        }
      }
    ],
    [handleStatusChange, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<Workflow>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No workflows found"
          enableSelection
          errorMessage={paginatedWorkflows.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(workflow) => workflow._id}
          headerHeight={46}
          loading={paginatedWorkflows.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={workflows}
          rowHeight={64}
          searchAccessor={(workflow) =>
            [
              workflow.workflowName,
              workflow.description,
              workflow.levels?.join(" "),
              workflow.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search workflows..."
          tableName={t("gxpWorkflows")}
          {...paginatedWorkflows.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-h-[calc(100dvh-2rem)] max-w-[900px] m-4 overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateWorkflowModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeWorkflow || undefined}
          mode={workflowModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteWorkflows.length > 0}
        onClose={() => setPendingDeleteWorkflows([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteWorkflows.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteWorkflows.length} workflows?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteWorkflows[0]?.workflowName
                })}`}
          </div>

          {pendingDeleteWorkflows.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteWorkflows.slice(0, 5).map((workflow) => (
                <div key={workflow._id} className="truncate py-0.5">
                  {workflow.workflowName}
                </div>
              ))}
              {pendingDeleteWorkflows.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteWorkflows.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteWorkflows([])}
              className="flex items-center px-4 py-2 text-white"
            >
              {t("cancel")}
            </Button>
            <Button
              startIcon={<CheckLineIcon className="h-4 w-4" />}
              onClick={() => void handleDeleteConfirmed()}
              className="flex items-center px-4 py-2"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Workflows;
