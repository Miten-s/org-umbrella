import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import CountWithTooltip from "@/components/common/CountWithTooltip";
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
import CreateRoleModal from "@/pages/access-management/roles-and-permissions/CreateRoleModal";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole
} from "@/services/admin.service";
import { PermissionType, RoleType } from "@/utils/common.constants";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type RoleRecord = {
  _id: string;
  name: string;
  permissions?: Array<{ _id?: string; name?: string } | string>;
};

type RoleModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "R";

const getPermissionNames = (role: RoleRecord) =>
  (role.permissions ?? [])
    .map((permission) =>
      typeof permission === "string" ? permission : (permission?.name ?? "")
    )
    .filter(Boolean);

const copyRolesToClipboard = async (rows: RoleRecord[]) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Role\tPermissions",
    ...rows.map((role) =>
      [role.name, getPermissionNames(role).join(", ")].join("\t")
    )
  ].join("\n");

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } else {
      throw new Error("Clipboard unavailable");
    }

    toast(
      rows.length > 1
        ? `${rows.length} roles copied to clipboard.`
        : "Role copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying roles:", error);
    toast("Failed to copy role details. Please try again.", "error");
  }
};

const Roles = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const paginatedRoles = useServerPagination<RoleRecord>({
    dataKeys: ["roles"],
    dependencies: [reFetch],
    errorMessage: "Failed to load roles. Please try again.",
    fetchPage: (params) => getRoles(RoleType.GXP_SERVICE, params)
  });
  const roles = paginatedRoles.rows;
  const [permissions, setPermissions] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [activeRole, setActiveRole] = useState<RoleRecord | null>(null);
  const [roleModalMode, setRoleModalMode] = useState<RoleModalMode>("create");
  const [pendingDeleteRoles, setPendingDeleteRoles] = useState<RoleRecord[]>(
    []
  );

  const handleCloseModal = () => {
    closeModal();
    setActiveRole(null);
    setRoleModalMode("create");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { permissions } = await getPermissions(
          PermissionType.GXP_SERVICE,
          {
            limit: 100
          }
        );
        setPermissions(permissions ?? []);
      } catch (error) {
        console.error("Error fetching GXP role permissions:", error);
      }
    };

    void fetchInitialData();
  }, [reFetch]);

  const handleSave = async (data: {
    roleName: string;
    permissions: string[];
  }) => {
    const permissionIds = data.permissions
      .map((permissionName) =>
        permissions.find((permission) => permission.name === permissionName)
      )
      .filter(
        (permission): permission is { _id: string; name: string } =>
          permission !== undefined
      )
      .map((permission) => permission._id);

    const payload = {
      name: data.roleName.trim(),
      permissions: permissionIds,
      type: RoleType.GXP_SERVICE
    };

    try {
      if (activeRole) {
        await updateRole(activeRole._id, payload);
      } else {
        await createRole(payload);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving GXP role:", error);
      toast("Failed to save role. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteRoles.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteRoles.map((role) => deleteRole(role._id, { silent: true }))
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteRoles.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} roles deleted successfully.`
            : "Role deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} roles deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected roles. Please try again.", "error");
      }

      setPendingDeleteRoles([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting roles:", error);
      toast("Failed to delete selected roles. Please try again.", "error");
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<RoleRecord>[]>(
    () => [
      {
        key: "create-role",
        label: t("create", { entity: t("gxpRoles") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveRole(null);
          setRoleModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_ROLE,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<RoleRecord>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy roles" : "Copy role",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyRolesToClipboard(selectedRows)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete roles" : "Delete role",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_ROLE,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteRoles(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<RoleRecord>[]>(
    () => [
      {
        key: "view",
        label: "View role",
        tooltip: "View role",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_ROLE,
        onClick: (role) => {
          setActiveRole(role);
          setRoleModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit role",
        tooltip: "Edit role",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_ROLE,
        onClick: (role) => {
          setActiveRole(role);
          setRoleModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy role",
        tooltip: "Copy role",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (role) => copyRolesToClipboard([role])
      },
      {
        key: "delete",
        label: "Delete role",
        tooltip: "Delete role",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_ROLE,
        tone: "danger",
        onClick: (role) => setPendingDeleteRoles([role])
      }
    ],
    [openModal]
  );

  const columnDefs = useMemo<ColDef<RoleRecord>[]>(
    () => [
      {
        field: "name",
        flex: 0.9,
        headerName: t("roleName"),
        minWidth: 240,
        cellRenderer: (params: ICellRendererParams<RoleRecord>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.name)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.name}
              </div>
            </div>
          );
        }
      },
      {
        field: "permissions",
        flex: 1.4,
        headerName: t("permissions"),
        minWidth: 320,
        sortable: false,
        valueGetter: ({ data }) =>
          getPermissionNames(data as RoleRecord).join(", "),
        cellRenderer: (params: ICellRendererParams<RoleRecord>) => {
          const data = params.data;
          if (!data) return null;

          const permissionNames = getPermissionNames(data);
          const visiblePermissions = permissionNames.slice(0, 2);

          if (!permissionNames.length) {
            return (
              <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
                -
              </div>
            );
          }

          return (
            <div className="flex flex-wrap items-center gap-2 py-1.5">
              {visiblePermissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                >
                  {permission}
                </span>
              ))}
              {permissionNames.length > 2 ? (
                <CountWithTooltip
                  count={permissionNames.length - 2}
                  items={permissionNames.slice(2)}
                  headerLabel={`Permissions (${permissionNames.length})`}
                  className="self-center"
                  portal
                />
              ) : null}
            </div>
          );
        }
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<RoleRecord>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No roles found"
          enableSelection
          errorMessage={paginatedRoles.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(role) => role._id}
          headerHeight={46}
          loading={paginatedRoles.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={roles}
          rowHeight={64}
          searchAccessor={(role) =>
            [role.name, getPermissionNames(role).join(" ")]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search roles..."
          tableName={t("rolesAndPermissions")}
          {...paginatedRoles.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateRoleModal
          onClose={handleCloseModal}
          onSubmit={({ name, permissions: permissionNames }) =>
            handleSave({
              roleName: name,
              permissions: permissionNames
            })
          }
          activeRole={
            activeRole
              ? {
                  name: activeRole.name,
                  permissions: (activeRole.permissions ?? []).map(
                    (permission) => ({
                      name:
                        typeof permission === "string"
                          ? permission
                          : (permission?.name ?? "")
                    })
                  )
                }
              : undefined
          }
          permissions={permissions.map((permission) => permission.name ?? "")}
          permissionType={PermissionType.GXP_SERVICE}
          mode={roleModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteRoles.length > 0}
        onClose={() => setPendingDeleteRoles([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteRoles.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteRoles.length} roles?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteRoles[0]?.name
                })} ?`}
          </div>

          {pendingDeleteRoles.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteRoles.slice(0, 5).map((role) => (
                <div key={role._id} className="truncate py-0.5">
                  {role.name}
                </div>
              ))}
              {pendingDeleteRoles.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteRoles.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteRoles([])}
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

export default Roles;
