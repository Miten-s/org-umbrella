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
import { toast } from "@/lib/ToastProvider";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import { getRoles, getUsers } from "@/services/admin.service";
import {
  createGxpUser,
  deleteGxpUser,
  disableGxpUser,
  enableGxpUser,
  getGxpUsers,
  updateGxpUser
} from "@/services/gxp.service";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { RoleType } from "@/utils/common.constants";
import { extractList } from "@/utils/listResponse";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateGxpUserModal, { GxpUserEntity } from "./CreateGxpUserModal";

type Role = { _id: string; name: string };
type BareUser = { _id: string; fullName?: string; name?: string };
type RoleRef = string | { _id?: string; name?: string };
type GxpUserModalMode = "create" | "edit" | "view";

const normalizeRoles = (roles: RoleRef[] | RoleRef | undefined): string[] => {
  if (!roles) return [];
  if (Array.isArray(roles)) {
    return roles
      .map((role) => (typeof role === "string" ? role : role?._id ?? ""))
      .filter(Boolean);
  }
  return [typeof roles === "string" ? roles : roles?._id ?? ""].filter(Boolean);
};

const normalizeGxpUser = (user: any): GxpUserEntity => ({
  _id: user?._id ?? "",
  user: {
    id: user?.user?.id ?? "",
    name: user?.user?.name ?? ""
  },
  userType: user?.userType ?? "User",
  roles: normalizeRoles(user?.roles),
  description: user?.description,
  status: user?.status ?? "enabled"
});

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "U";

const copyUsersToClipboard = async (
  rows: GxpUserEntity[],
  roleNameMap: Map<string, string>
) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "User\tType\tRoles\tDescription\tStatus",
    ...rows.map((user) =>
      [
        user.user?.name ?? "",
        user.userType,
        user.roles
          .map((roleId) => roleNameMap.get(roleId) ?? roleId)
          .filter(Boolean)
          .join(", "),
        user.description ?? "",
        user.status
      ].join("\t")
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
      rows.length > 1 ? `${rows.length} GXP users copied to clipboard.` : "GXP user copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying GXP users:", error);
    toast("Failed to copy GXP user details. Please try again.", "error");
  }
};

const GXPUsersPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [includeDisabled, setIncludeDisabled] = useState(false);
  const paginatedGxpUsers = useServerPagination<GxpUserEntity>({
    dataKeys: ["gxpUsers", "users", "items", "data"],
    dependencies: [includeDisabled, reFetch],
    errorMessage: "Failed to load GXP users. Please try again.",
    fetchPage: (params) => getGxpUsers(includeDisabled, params),
    mapItems: (items) => items.map(normalizeGxpUser)
  });
  const gxpUsers = paginatedGxpUsers.rows;
  const setGxpUsers = paginatedGxpUsers.setRows;
  const [activeUser, setActiveUser] = useState<GxpUserEntity | null>(null);
  const [userModalMode, setUserModalMode] = useState<GxpUserModalMode>("create");
  const [pendingDeleteUsers, setPendingDeleteUsers] = useState<GxpUserEntity[]>([]);
  const [selectableUsers, setSelectableUsers] = useState<BareUser[]>([]);
  const [selectableRoles, setSelectableRoles] = useState<Role[]>([]);

  const roleNameMap = useMemo(
    () => new Map(selectableRoles.map((role) => [role._id, role.name])),
    [selectableRoles]
  );

  const handleCloseModal = () => {
    closeModal();
    setActiveUser(null);
    setUserModalMode("create");
  };

  const getUserRoleNames = (user: GxpUserEntity) =>
    user.roles
      .map((roleId) => roleNameMap.get(roleId) ?? roleId)
      .filter(Boolean);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          getUsers({ limit: 100 }),
          getRoles(RoleType.GXP_SERVICE, { limit: 100 })
        ]);

        setSelectableUsers(
          extractList<any>(usersRes, ["users"]).map((user) => ({
            _id: user._id,
            fullName: user.fullName ?? user.name,
            name: user.fullName ?? user.name
          }))
        );

        setSelectableRoles(
          extractList<any>(rolesRes, ["roles"]).map((role) => ({
            _id: role._id,
            name: role.name
          }))
        );

      } catch (error) {
        console.error("Error fetching GXP user references:", error);
      }
    };

    void fetchData();
  }, [reFetch]);

  const handleSave = async (payload: Partial<GxpUserEntity>) => {
    try {
      if (activeUser) {
        await updateGxpUser(activeUser._id, payload);
      } else {
        await createGxpUser(payload);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving GXP user:", error);
      toast("Failed to save GXP user. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteUsers.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteUsers.map((user) => deleteGxpUser(user._id, { silent: true }))
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteUsers.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} GXP users deleted successfully.`
            : "GXP user deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} GXP users deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected GXP users. Please try again.", "error");
      }

      setPendingDeleteUsers([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting GXP users:", error);
      toast("Failed to delete selected GXP users. Please try again.", "error");
    }
  };

  const handleStatusChange = async (user: GxpUserEntity) => {
    const nextStatus = user.status === "enabled" ? "disabled" : "enabled";

    setGxpUsers((prev) =>
      prev.map((item) =>
        item._id === user._id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      if (nextStatus === "enabled") {
        await enableGxpUser(user._id);
      } else {
        await disableGxpUser(user._id);
      }
    } catch (error) {
      console.error("Failed to update GXP user status", error);
      setGxpUsers((prev) =>
        prev.map((item) =>
          item._id === user._id ? { ...item, status: user.status } : item
        )
      );
    }
  };

  const titleExtra = useMemo<ReactNode>(
    () => (
      <Switch
        label={t("includeDisabled")}
        checked={includeDisabled}
        onChange={() => setIncludeDisabled((prev) => !prev)}
      />
    ),
    [includeDisabled, t]
  );

  const toolbarActions = useMemo<AppDataTableToolbarAction<GxpUserEntity>[]>(
    () => [
      {
        key: "create-gxp-user",
        label: t("create", { entity: t("gxpUsers") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveUser(null);
          setUserModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_USER,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<GxpUserEntity>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy GXP users" : "Copy GXP user",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyUsersToClipboard(selectedRows, roleNameMap)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete GXP users" : "Delete GXP user",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_USER,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteUsers(selectedRows)
      }
    ],
    [roleNameMap]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpUserEntity>[]>(
    () => [
      {
        key: "view",
        label: "View GXP user",
        tooltip: "View GXP user",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_USER,
        onClick: (user) => {
          setActiveUser(user);
          setUserModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit GXP user",
        tooltip: "Edit GXP user",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_USER,
        onClick: (user) => {
          setActiveUser(user);
          setUserModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy GXP user",
        tooltip: "Copy GXP user",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (user) => copyUsersToClipboard([user], roleNameMap)
      },
      {
        key: "delete",
        label: "Delete GXP user",
        tooltip: "Delete GXP user",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_USER,
        tone: "danger",
        onClick: (user) => setPendingDeleteUsers([user])
      }
    ],
    [openModal, roleNameMap]
  );

  const columnDefs = useMemo<ColDef<GxpUserEntity>[]>(
    () => [
      {
        field: "user",
        flex: 1,
        headerName: t("userName"),
        minWidth: 240,
        valueGetter: ({ data }) => data?.user?.name ?? "-",
        cellRenderer: (params: ICellRendererParams<GxpUserEntity>) => {
          const data = params.data;
          if (!data) return null;

          const userName = data.user?.name ?? "-";

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {userName}
              </div>
            </div>
          );
        }
      },
      {
        field: "userType",
        flex: 0,
        headerName: t("userType"),
        minWidth: 140,
        maxWidth: 170,
        cellRenderer: (params: ICellRendererParams<GxpUserEntity>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.userType ?? "-"}
          </div>
        )
      },
      {
        field: "roles",
        flex: 1.1,
        headerName: t("gxpAppRoles"),
        minWidth: 240,
        sortable: false,
        valueGetter: ({ data }) => getUserRoleNames(data as GxpUserEntity).join(", "),
        cellRenderer: (params: ICellRendererParams<GxpUserEntity>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {getUserRoleNames(params.data as GxpUserEntity).join(", ") || "-"}
          </div>
        )
      },
      {
        field: "description",
        flex: 1.2,
        headerName: t("description"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<GxpUserEntity>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.description || "-"}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<GxpUserEntity>) => {
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
    [roleNameMap, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<GxpUserEntity>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No GXP users found"
          enableSelection
          errorMessage={paginatedGxpUsers.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(user) => user._id}
          headerHeight={46}
          loading={paginatedGxpUsers.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={gxpUsers}
          rowHeight={64}
          searchAccessor={(user) =>
            [
              user.user?.name,
              user.userType,
              getUserRoleNames(user).join(" "),
              user.description,
              user.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search GXP users..."
          tableName={t("users")}
          titleExtra={titleExtra}
          {...paginatedGxpUsers.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[720px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateGxpUserModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeUser || undefined}
          mode={userModalMode}
          selectableUsers={selectableUsers}
          selectableRoles={selectableRoles}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteUsers.length > 0}
        onClose={() => setPendingDeleteUsers([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteUsers.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteUsers.length} GXP users?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteUsers[0]?.user?.name
                })} ?`}
          </div>

          {pendingDeleteUsers.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="truncate py-0.5">
                  {user.user?.name}
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

export default GXPUsersPage;
