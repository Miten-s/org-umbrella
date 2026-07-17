import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
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
  bulkDeleteEnvironments,
  bulkDuplicateEnvironments,
  createEnvironment,
  getEnvironments,
  updateEnvironment
} from "@/services/gxp.service";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateEnvironmentModal from "./CreateEnvironmentModal";

interface EnvironmentRecord {
  _id: string;
  environmentName: string;
  description?: string;
}

type EnvironmentModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "E";

const Environments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const paginatedEnvironments = useServerPagination<EnvironmentRecord>({
    dataKeys: ["environments", "data"],
    dependencies: [reFetch],
    errorMessage: "Failed to load environments. Please try again.",
    fetchPage: (params) => getEnvironments(false, params)
  });
  const environments = paginatedEnvironments.rows;
  const [activeEnvironment, setActiveEnvironment] =
    useState<EnvironmentRecord | null>(null);
  const [environmentModalMode, setEnvironmentModalMode] =
    useState<EnvironmentModalMode>("create");
  const [pendingDeleteEnvironments, setPendingDeleteEnvironments] = useState<
    EnvironmentRecord[]
  >([]);

  const handleCloseModal = () => {
    closeModal();
    setActiveEnvironment(null);
    setEnvironmentModalMode("create");
  };

  const handleSave = async (data: Partial<EnvironmentRecord>) => {
    try {
      if (activeEnvironment) {
        await updateEnvironment(activeEnvironment._id, data);
      } else {
        await createEnvironment(data);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving environment:", error);
      toast("Failed to save environment. Please try again.", "error");
    }
  };

  const handleDuplicateEnvironments = useCallback(
    async (rows: EnvironmentRecord[]) => {
      if (!rows.length) {
        return;
      }

      try {
        await bulkDuplicateEnvironments(
          rows.map((environment) => environment._id),
          { silent: true }
        );
        toast(
          rows.length > 1
            ? `${rows.length} environments copied successfully.`
            : "Environment copied successfully.",
          "success"
        );
        setReFetch(!reFetch);
      } catch (error) {
        console.error("Error copying environments:", error);
        toast("Failed to copy selected environments. Please try again.", "error");
      }
    },
    [reFetch, setReFetch]
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteEnvironments.length) {
      return;
    }

    try {
      await bulkDeleteEnvironments(
        pendingDeleteEnvironments.map((environment) => environment._id),
        { silent: true }
      );
      toast(
        pendingDeleteEnvironments.length > 1
          ? `${pendingDeleteEnvironments.length} environments deleted successfully.`
          : "Environment deleted successfully.",
        "success"
      );

      setPendingDeleteEnvironments([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting environment:", error);
      toast(
        "Failed to delete selected environments. Please try again.",
        "error"
      );
    }
  };

  const toolbarActions = useMemo<
    AppDataTableToolbarAction<EnvironmentRecord>[]
  >(
    () => [
      {
        key: "create-environment",
        label: t("create", { entity: t("environment") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveEnvironment(null);
          setEnvironmentModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_ENVIRONMENT,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<EnvironmentRecord>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy environments" : "Copy environment",
        icon: CopyIcon,
        variant: "outline",
        onClick: handleDuplicateEnvironments
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Delete environments"
            : "Delete environment",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_ENVIRONMENT,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteEnvironments(selectedRows)
      }
    ],
    [handleDuplicateEnvironments]
  );

  const rowActions = useMemo<AppDataTableRowAction<EnvironmentRecord>[]>(
    () => [
      {
        key: "view",
        label: "View environment",
        tooltip: "View environment",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_ENVIRONMENT,
        onClick: (environment) => {
          setActiveEnvironment(environment);
          setEnvironmentModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit environment",
        tooltip: "Edit environment",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
        onClick: (environment) => {
          setActiveEnvironment(environment);
          setEnvironmentModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy environment",
        tooltip: "Copy environment",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (environment) =>
          handleDuplicateEnvironments([environment])
      },
      {
        key: "delete",
        label: "Delete environment",
        tooltip: "Delete environment",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_ENVIRONMENT,
        tone: "danger",
        onClick: (environment) => setPendingDeleteEnvironments([environment])
      }
    ],
    [handleDuplicateEnvironments, openModal]
  );

  const columnDefs = useMemo<ColDef<EnvironmentRecord>[]>(
    () => [
      {
        field: "environmentName",
        flex: 1,
        headerName: t("environmentName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<EnvironmentRecord>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.environmentName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.environmentName}
              </div>
            </div>
          );
        }
      },
      {
        field: "description",
        flex: 1.2,
        headerName: t("description"),
        minWidth: 280,
        cellRenderer: (params: ICellRendererParams<EnvironmentRecord>) => (
          <div className="truncate py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<EnvironmentRecord>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No environments found"
          enableSelection
          errorMessage={paginatedEnvironments.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(environment) => environment._id}
          headerHeight={46}
          loading={paginatedEnvironments.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={environments}
          rowHeight={64}
          searchAccessor={(environment) =>
            [environment.environmentName, environment.description]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search environments..."
          tableName={t("gxpEnvironments")}
          {...paginatedEnvironments.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateEnvironmentModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeEnvironment || undefined}
          mode={environmentModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteEnvironments.length > 0}
        onClose={() => setPendingDeleteEnvironments([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteEnvironments.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteEnvironments.length} environments?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteEnvironments[0]?.environmentName
                })}`}
          </div>

          {pendingDeleteEnvironments.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteEnvironments.slice(0, 5).map((environment) => (
                <div key={environment._id} className="truncate py-0.5">
                  {environment.environmentName}
                </div>
              ))}
              {pendingDeleteEnvironments.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteEnvironments.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteEnvironments([])}
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

export default Environments;
