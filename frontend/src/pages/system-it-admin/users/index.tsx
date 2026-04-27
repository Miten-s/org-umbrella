import CountWithTooltip from "@/components/common/CountWithTooltip";
import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableTab,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useServerPagination } from "@/hooks/useServerPagination";
import { toast } from "@/lib/ToastProvider";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  createUser,
  deleteUser,
  getDepartments,
  getDesignations,
  getLocations,
  getRoles,
  getUsers,
  updateUser
} from "@/services/admin.service";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "@/hooks/useModal";
import { RoleType } from "@/utils/common.constants";
import CreateUserModal from "./CreateUserModal";

interface UserRole {
  _id: string;
  name: string;
  permissions?: { _id: string; name: string }[];
  type: string;
}

interface LocationOption {
  _id: string;
  locationName: string;
}

interface DepartmentOption {
  _id: string;
  departmentName: string;
}

interface DesignationOption {
  _id: string;
  designationName: string;
}

interface UserRecord {
  _id: string;
  department?: DepartmentOption;
  description?: string;
  designation?: DesignationOption;
  email: string;
  fullName?: string;
  location?: LocationOption;
  modifiable?: boolean;
  name: string;
  phone?: string;
  roles: UserRole[];
  signature?: string;
  status: "active" | "disabled";
  trainingCompleted?: boolean;
  userType?: "Admin" | "User";
}

type UserModalMode = "create" | "edit" | "view";

const getDisplayName = (user?: UserRecord | null) =>
  user?.fullName || user?.name || user?.email || "User";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "U";

const Users = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [activeUser, setActiveUser] = useState<UserRecord | null>(null);
  const [userModalMode, setUserModalMode] = useState<UserModalMode>("create");
  const [pendingDeleteUsers, setPendingDeleteUsers] = useState<UserRecord[]>([]);
  const { reFetch, setReFetch } = useGlobalContext();
  const paginatedUsers = useServerPagination<UserRecord>({
    dataKeys: ["users"],
    dependencies: [reFetch],
    errorMessage: "Failed to load users. Please try again.",
    fetchPage: getUsers
  });
  const users = paginatedUsers.rows;

  const showComingSoonToast = (label: string) => {
    toast(
      `${label} action is available in the table UI and can be connected when the API is ready.`,
      "success"
    );
  };

  const fetchReferenceDetails = useCallback(async () => {
    try {
      const [
        { roles: fetchedRoles },
        { locations: fetchedLocations },
        { departments: fetchedDepartments },
        { designations: fetchedDesignations }
      ] = await Promise.all([
        getRoles(RoleType.CUSTOM, { limit: 100 }),
        getLocations({ limit: 100 }),
        getDepartments({ limit: 100 }),
        getDesignations({ limit: 100 })
      ]);

      setRoles(fetchedRoles ?? []);
      setLocations(fetchedLocations ?? []);
      setDepartments(fetchedDepartments ?? []);
      setDesignations(fetchedDesignations ?? []);
    } catch (error) {
      console.error("Error fetching user form data:", error);
    }
  }, []);

  useEffect(() => {
    void fetchReferenceDetails();
  }, [fetchReferenceDetails, reFetch]);

  const buildUserFormData = (payload: Record<string, unknown>) => {
    const formData = new FormData();
    const { signature, ...rest } = payload;
    formData.append("data", JSON.stringify(rest));

    if (
      signature &&
      typeof signature === "string" &&
      signature.startsWith("data:")
    ) {
      const [meta, base64] = signature.split(",");
      const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: mime });
      formData.append("signature", blob, "signature.png");
    }

    return formData;
  };

  const handleCreateUpdateUser = async (data: Record<string, unknown>) => {
    try {
      const formData = buildUserFormData(data);

      if (activeUser) {
        await updateUser(activeUser._id, formData);
      } else {
        await createUser(formData);
      }

      closeModal();
      setActiveUser(null);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving user:", error);
      toast("Failed to save user. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteUsers.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteUsers.map((user) => deleteUser(user._id, { silent: true }))
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteUsers.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} users deleted successfully.`
            : "User deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} users deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected users. Please try again.", "error");
      }

      setPendingDeleteUsers([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast("Failed to delete selected users. Please try again.", "error");
    }
  };

  const tableTabs = useMemo<AppDataTableTab<UserRecord>[]>(
    () => [
      {
        key: "all",
        label: "All",
        predicate: () => true
      },
      {
        key: "active",
        label: t("active"),
        predicate: (user) => user.status === "active"
      },
      {
        key: "inactive",
        label: "Inactive",
        predicate: (user) => user.status !== "active"
      }
    ],
    [t]
  );

  const toolbarActions = useMemo<AppDataTableToolbarAction<UserRecord>[]>(
    () => [
      {
        key: "create-user",
        label: "New user",
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setUserModalMode("create");
          setActiveUser(null);
          openModal();
        },
        permission: [
          "CREATE:USER",
          "VIEW:DEPARTMENT",
          "VIEW:DESIGNATION",
          "VIEW:LOCATION"
        ],
        permissionLogic: "all",
        variant: "primary"
      }
    ],
    [openModal]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<UserRecord>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy users" : "Copy user",
        icon: CopyIcon,
        permission: "CREATE:USER",
        variant: "outline",
        onClick: (selectedRows) =>
          showComingSoonToast(
            selectedRows.length > 1 ? "Copy users" : "Copy user"
          )
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete users" : "Delete user",
        icon: TrashBinIcon,
        permission: "DELETE:USER",
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteUsers(selectedRows)
      }
    ],
    [showComingSoonToast]
  );

  const rowActions = useMemo<AppDataTableRowAction<UserRecord>[]>(
    () => [
      {
        key: "view",
        label: "View user",
        tooltip: "View user details",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:USER",
        onClick: (user) => {
          setUserModalMode("view");
          setActiveUser(user);
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit user",
        tooltip: "Edit user",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:USER",
        onClick: (user) => {
          setUserModalMode("edit");
          setActiveUser(user);
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy user",
        tooltip: "Copy user",
        icon: CopyIcon,
        placement: "menu",
        permission: "CREATE:USER",
        onClick: () => showComingSoonToast("Copy user")
      },
      {
        key: "delete",
        label: "Delete user",
        tooltip: "Delete user",
        icon: TrashBinIcon,
        placement: "menu",
        permission: "DELETE:USER",
        tone: "danger",
        onClick: (user) => setPendingDeleteUsers([user])
      },
      {
        key: "reset-password",
        label: "Reset password",
        icon: LockIcon,
        placement: "menu",
        permission: "UPDATE:USER",
        onClick: () => showComingSoonToast("Reset password")
      }
    ],
    [openModal, showComingSoonToast]
  );

  const columnDefs = useMemo<ColDef<UserRecord>[]>(
    () => [
      {
        field: "fullName",
        flex: 1.2,
        headerName: t("fullName"),
        minWidth: 250,
        valueGetter: ({ data }) => getDisplayName(data),
        cellRenderer: (params: ICellRendererParams<UserRecord>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const displayName = getDisplayName(data);
          const initials = getInitials(displayName);

          return (
            <div className="flex items-center gap-2.5 py-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </div>
               
              </div>
            </div>
          );
        }
      },
      {
        field: "email",
        flex: 1.2,
        headerName: t("email"),
        minWidth: 240,
        cellRenderer: (params: ICellRendererParams<UserRecord>) => (
          <div className="truncate py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      },
      {
        field: "roles",
        flex: 0,
        headerName: t("role"),
        maxWidth: 220,
        minWidth: 180,
        width: 190,
        valueGetter: ({ data }) =>
          data?.roles?.map((role) => role.name).join(", ") ?? "",
        cellRenderer: (params: ICellRendererParams<UserRecord>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const primaryRoles = data.roles.slice(0, 2);
          const hiddenRoles = data.roles.slice(2).map((role) => role.name);

          return (
            <div className="flex w-full flex-wrap items-center gap-2 py-1.5">
              {primaryRoles.map((role) => {
                const isDefault = role.type === "Built_In";

                return (
                  <span
                    key={role._id}
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      isDefault
                        ? "bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300"
                        : "bg-blue-light-100 text-blue-light-800 dark:bg-blue-light-500/15 dark:text-blue-light-300"
                    ].join(" ")}
                    title={isDefault ? "Default System Role" : "Custom Role"}
                  >
                    {isDefault ? <LockIcon className="h-3 w-3" /> : null}
                    {role.name}
                  </span>
                );
              })}

              {hiddenRoles.length ? (
                <CountWithTooltip
                  buttonLabel={`+ ${hiddenRoles.length}`}
                  count={hiddenRoles.length}
                  headerLabel={`Roles (${hiddenRoles.length} more)`}
                  items={hiddenRoles}
                  placement="right"
                />
              ) : null}
            </div>
          );
        }
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        maxWidth: 128,
        minWidth: 128,
        width: 128,
        valueGetter: ({ data }) =>
          data?.status === "active" ? t("active") : "Inactive",
        cellRenderer: (params: ICellRendererParams<UserRecord>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const isActive = data.status === "active";

          return (
            <div className="flex w-full justify-center py-1.5">
              <span
                className={[
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  isActive
                    ? "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300"
                    : "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300"
                ].join(" ")}
              >
                {isActive ? t("active") : "Inactive"}
              </span>
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
        <AppDataTable<UserRecord>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultTabKey="all"
          defaultColDef={{ flex: 1, minWidth: 190 }}
          emptyMessage={t("noAdminsFound")}
          enableSelection
          errorMessage={paginatedUsers.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(user) => user._id}
          headerHeight={46}
          loading={paginatedUsers.isLoading}
          maxInlineRowActions={2}
          paginateChildRows
          rowActions={rowActions}
          rowData={users}
          rowHeight={60}
          searchAccessor={(user) =>
            [
              getDisplayName(user),
              user.name,
              user.email,
              user.status,
              user.userType,
              user.roles.map((role) => role.name).join(" ")
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search users..."
          tableName={t("users")}
          tabs={tableTabs}
          {...paginatedUsers.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          setActiveUser(null);
          setUserModalMode("create");
        }}
        className="m-4 max-h-[100rem] max-w-[1000px] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateUserModal
          activeUser={activeUser}
          departments={departments}
          designations={designations}
          locations={locations}
          mode={userModalMode}
          onClose={() => {
            closeModal();
            setActiveUser(null);
            setUserModalMode("create");
          }}
          onSubmit={handleCreateUpdateUser}
          roles={roles}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteUsers.length > 0}
        onClose={() => setPendingDeleteUsers([])}
        className="m-4 min-h-[150px] max-w-[600px]"
        showCloseButton={false}
      >
        <div className="flex h-full flex-col justify-between p-5 dark:text-white">
          <div className="py-2">
            {pendingDeleteUsers.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteUsers.length} users?`
              : `${t("deleteEntityPrompt", {
                  entityName: getDisplayName(pendingDeleteUsers[0])
                })} ?`}
          </div>

          {pendingDeleteUsers.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="truncate py-0.5">
                  {getDisplayName(user)}
                </div>
              ))}
              {pendingDeleteUsers.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteUsers.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteUsers([])}
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

export default Users;
