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
  bulkDeleteRoles,
  createRole,
  getPermissions,
  getRoles,
  updateRole
} from "@/services/admin.service";
import { PermissionType } from "@/utils/common.constants";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateRoleModal from "./CreateRoleModal";

interface Role {
  _id: string;
  name: string;
  type: string;
  permissions: { _id?: string; name?: string }[];
}

interface Permission {
  _id: string;
  name: string;
  type?: string;
}

type RoleModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "R";

const getPermissionNames = (role: Role) =>
  (role.permissions ?? [])
    .map((permission) => permission?.name ?? "")
    .filter(Boolean);

const copyRolesToClipboard = async (rows: Role[]) => {
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

const RolesAndPermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [roleModalMode, setRoleModalMode] =
    useState<RoleModalMode>("create");
  const { reFetch, setReFetch } = useGlobalContext();
  const [pendingDeleteRoles, setPendingDeleteRoles] = useState<Role[]>([]);
  const { t } = useTranslation();
  const [permissionType, setPermissionType] = useState<PermissionType>(
    PermissionType.DEFAULT
  );

  const handleCloseModal = () => {
    closeModal();
    setActiveRole(null);
    setRoleModalMode("create");
  };

  const handleCreateRole = async (data: {
    name: string;
    permissions: string[];
  }) => {
    const permissionIds = data.permissions
      .map((permName) => permissions.find((perm) => perm.name === permName))
      .filter((perm): perm is Permission => perm !== undefined)
      .map((perm) => perm._id);

    const payload = {
      name: data.name,
      permissions: permissionIds
    };

    try {
      if (activeRole) {
        await updateRole(activeRole._id, payload);
      } else {
        await createRole(payload);
      }

      handleCloseModal();
      setReFetch(!reFetch);
    } catch {
      toast("Failed to save role. Please try again.", "error");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { roles: fetchedRoles } = await getRoles(undefined, {
          limit: 100
        });
        setRoles(fetchedRoles ?? []);
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast("Failed to load roles. Please try again.", "error");
      }
    })();
  }, [reFetch]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { permissions: fetchedPermissions } = await getPermissions(
          permissionType,
          {
            limit: 100
          }
        );
        setPermissions(fetchedPermissions ?? []);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast("Failed to load permissions. Please try again.", "error");
      }
    })();
  }, [isOpen, permissionType]);

  const resolvePermissionType = (role?: Role | null) =>
    role?.type === PermissionType.GXP_SERVICE
      ? PermissionType.GXP_SERVICE
      : PermissionType.DEFAULT;

  const handlePermissionTypeChange = (type: "default" | "gxp_service") => {
    setPermissionType(type as PermissionType);
  };

  const handleOpenCreate = useCallback(() => {
    setActiveRole(null);
    setRoleModalMode("create");
    setPermissionType(resolvePermissionType(null));
    openModal();
  }, [openModal]);

  const handleOpenEdit = useCallback((role: Role) => {
    setActiveRole(role);
    setRoleModalMode("edit");
    setPermissionType(resolvePermissionType(role));
    openModal();
  }, [openModal]);

  const handleOpenView = useCallback((role: Role) => {
    setActiveRole(role);
    setRoleModalMode("view");
    setPermissionType(resolvePermissionType(role));
    openModal();
  }, [openModal]);

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteRoles.length) {
      return;
    }

    try {
      await bulkDeleteRoles(
        pendingDeleteRoles.map((role) => role._id),
        { silent: true }
      );
      toast(
        pendingDeleteRoles.length > 1
          ? `${pendingDeleteRoles.length} roles deleted successfully.`
          : "Role deleted successfully.",
        "success"
      );

      setPendingDeleteRoles([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting roles:", error);
      toast("Failed to delete selected roles. Please try again.", "error");
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<Role>[]>(
    () => [
      {
        key: "create-role",
        label: t("create", { entity: t("role") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: handleOpenCreate,
        permission: ADMIN_PERMISSIONS.CREATE_ROLE,
        variant: "primary"
      }
    ],
    [handleOpenCreate, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<Role>[]>(
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
        permission: ADMIN_PERMISSIONS.DELETE_ROLE,
        variant: "destructive",
        disabled: (selectedRows) =>
          selectedRows.some((role) => role.type === "Built_In"),
        tooltip: (selectedRows) =>
          selectedRows.some((role) => role.type === "Built_In")
            ? "Built-in roles cannot be deleted"
            : "Delete selected roles",
        onClick: (selectedRows) => setPendingDeleteRoles(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<Role>[]>(
    () => [
      {
        key: "view",
        label: "View role",
        tooltip: "View role",
        icon: EyeIcon,
        placement: "inline",
        permission: ADMIN_PERMISSIONS.VIEW_ROLE,
        onClick: handleOpenView
      },
      {
        key: "edit",
        label: "Edit role",
        tooltip: "Edit role",
        icon: PencilIcon,
        placement: "inline",
        permission: ADMIN_PERMISSIONS.UPDATE_ROLE,
        hidden: (role) => role.type === "Built_In",
        onClick: handleOpenEdit
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
        permission: ADMIN_PERMISSIONS.DELETE_ROLE,
        tone: "danger",
        hidden: (role) => role.type === "Built_In",
        onClick: (role) => setPendingDeleteRoles([role])
      }
    ],
    [handleOpenEdit, handleOpenView]
  );

  const columnDefs = useMemo<ColDef<Role>[]>(
    () => [
      {
        field: "name",
        flex: 0.9,
        headerName: t("roleName"),
        minWidth: 240,
        cellRenderer: (params: ICellRendererParams<Role>) => {
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
        valueGetter: ({ data }) => getPermissionNames(data as Role).join(", "),
        cellRenderer: (params: ICellRendererParams<Role>) => {
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
        <AppDataTable<Role>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage={t("noRolesFound")}
          enableSelection
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(role) => role._id}
          headerHeight={46}
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
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[1000px] max-h-[50rem] m-4"
      >
        <CreateRoleModal
          onClose={handleCloseModal}
          onSubmit={handleCreateRole}
          permissions={permissions.map((p) => p.name)}
          activeRole={
            activeRole
              ? {
                  name: activeRole.name,
                  permissions: getPermissionNames(activeRole).map((name) => ({
                    name
                  }))
                }
              : null
          }
          permissionType={permissionType}
          onPermissionTypeChange={handlePermissionTypeChange}
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

export default RolesAndPermissions;
