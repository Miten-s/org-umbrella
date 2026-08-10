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
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  bulkDeletePermissions,
  createPermission,
  getPermissions,
  updatePermission
} from "@/services/admin.service";
import { GxpPermission } from "@/types/common.types";
import { PermissionType } from "@/utils/common.constants";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateGxpPermissionModal from "./CreateGxpPermissionModal";

type PermissionModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "P";

const Permissions = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const paginatedPermissions = useServerPagination<GxpPermission>({
    dataKeys: ["permissions", "data"],
    dependencies: [reFetch],
    errorMessage: "Failed to load permissions. Please try again.",
    fetchPage: (params) => getPermissions(PermissionType.GXP_SERVICE, params),
    mapItems: (items) =>
      items.map((permission: any) => ({
        ...permission,
        permissionName: permission.permissionName ?? permission.name ?? ""
      }))
  });
  const permissions = paginatedPermissions.rows;
  const [activePermission, setActivePermission] =
    useState<GxpPermission | null>(null);
  const [permissionModalMode, setPermissionModalMode] =
    useState<PermissionModalMode>("create");
  const [pendingDeletePermissions, setPendingDeletePermissions] = useState<
    GxpPermission[]
  >([]);

  const handleCloseModal = () => {
    closeModal();
    setActivePermission(null);
    setPermissionModalMode("create");
  };

  const handleSave = async (data: Partial<GxpPermission>) => {
    const payload = {
      name: data.permissionName?.trim() ?? "",
      description: data.description,
      type: PermissionType.GXP_SERVICE
    };

    try {
      if (activePermission) {
        await updatePermission(activePermission._id, payload);
      } else {
        await createPermission(payload);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving GXP permission:", error);
      toast("Failed to save permission. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeletePermissions.length) {
      return;
    }

    try {
      await bulkDeletePermissions(
        pendingDeletePermissions.map((permission) => permission._id),
        { silent: true }
      );
      toast(
        pendingDeletePermissions.length > 1
          ? `${pendingDeletePermissions.length} permissions deleted successfully.`
          : "Permission deleted successfully.",
        "success"
      );

      setPendingDeletePermissions([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting permissions:", error);
      toast(
        "Failed to delete selected permissions. Please try again.",
        "error"
      );
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<GxpPermission>[]>(
    () => [
      {
        key: "create-permission",
        label: t("create", { entity: t("gxpPermissions") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActivePermission(null);
          setPermissionModalMode("create");
          openModal();
        },
        permission: ADMIN_PERMISSIONS.CREATE_PERMISSION,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<GxpPermission>[]>(
    () => [
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete permissions" : "Delete permission",
        icon: TrashBinIcon,
        permission: ADMIN_PERMISSIONS.DELETE_PERMISSION,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeletePermissions(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpPermission>[]>(
    () => [
      {
        key: "view",
        label: "View permission",
        tooltip: "View permission",
        icon: EyeIcon,
        placement: "inline",
        permission: ADMIN_PERMISSIONS.VIEW_PERMISSION,
        onClick: (permission) => {
          setActivePermission(permission);
          setPermissionModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit permission",
        tooltip: "Edit permission",
        icon: PencilIcon,
        placement: "inline",
        permission: ADMIN_PERMISSIONS.UPDATE_PERMISSION,
        onClick: (permission) => {
          setActivePermission(permission);
          setPermissionModalMode("edit");
          openModal();
        }
      },
      {
        key: "delete",
        label: "Delete permission",
        tooltip: "Delete permission",
        icon: TrashBinIcon,
        placement: "menu",
        permission: ADMIN_PERMISSIONS.DELETE_PERMISSION,
        tone: "danger",
        onClick: (permission) => setPendingDeletePermissions([permission])
      }
    ],
    [openModal]
  );

  const columnDefs = useMemo<ColDef<GxpPermission>[]>(
    () => [
      {
        field: "permissionName",
        flex: 1,
        headerName: t("permissionName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<GxpPermission>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.permissionName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.permissionName}
              </div>
            </div>
          );
        }
      },
      {
        field: "description",
        flex: 1.4,
        headerName: t("description"),
        minWidth: 320,
        cellRenderer: (params: ICellRendererParams<GxpPermission>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.description || "-"}
          </div>
        )
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <AppDataTable<GxpPermission>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No permissions found"
          enableSelection
          errorMessage={paginatedPermissions.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(permission) => permission._id}
          headerHeight={46}
          loading={paginatedPermissions.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={permissions}
          rowHeight={64}
          searchAccessor={(permission) =>
            [permission.permissionName, permission.description]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search permissions..."
          tableName={t("gxpPermissions")}
          {...paginatedPermissions.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateGxpPermissionModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activePermission || undefined}
          mode={permissionModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeletePermissions.length > 0}
        onClose={() => setPendingDeletePermissions([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeletePermissions.length > 1
              ? `Are you sure you want to delete these ${pendingDeletePermissions.length} permissions?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeletePermissions[0]?.permissionName
                })}`}
          </div>

          {pendingDeletePermissions.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeletePermissions.slice(0, 5).map((permission) => (
                <div key={permission._id} className="truncate py-0.5">
                  {permission.permissionName}
                </div>
              ))}
              {pendingDeletePermissions.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeletePermissions.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeletePermissions([])}
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

export default Permissions;
