import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  gxpUserKeys,
  useBulkDeleteGxpUser,
  useCreateGxpUser,
  useToggleGxpUserStatus,
  useUpdateGxpUser
} from "./GxpUser.queries";
import { fetchGxpUserList } from "./GxpUser.api";
import { getGxpUserColumns } from "./GxpUser.columns";
import GxpUserForm, { type GxpUserFormMode } from "./GxpUserForm";
import type { GxpUser, GxpUserPayload } from "./GxpUser.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** GXP Service Users — separate from System IT Admin Users; migrated to the standard. */
const GxpUserList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<GxpUser | null>(null);
  const [formMode, setFormMode] = useState<GxpUserFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const table = useServerTable<GxpUser>({
    entity: "gxpUser",
    queryKey: [...gxpUserKeys.all, { includeDisabled }],
    fetchList: useCallback(
      (params, signal) => fetchGxpUserList(includeDisabled, params, signal),
      [includeDisabled]
    )
  });

  const createUser = useCreateGxpUser();
  const updateUser = useUpdateGxpUser();
  const bulkDelete = useBulkDeleteGxpUser();
  const toggleStatus = useToggleGxpUserStatus();
  const busy = createUser.isPending || updateUser.isPending || bulkDelete.isPending || toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getGxpUserColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (user) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(user);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: GxpUserFormMode, user: GxpUser | null) => {
    setFormMode(mode);
    setActive(user);
    openModal();
  };
  const handleClose = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: GxpUserPayload) => {
    if (active) {
      await updateUser.mutateAsync({ id: active.id, payload });
    } else {
      await createUser.mutateAsync(payload);
    }
    handleClose();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete users" : "Delete user"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_USER,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.user.name || "-")
              : []
          );
        }
      }
    ],
    [table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpUser>[]>(
    () => [
      { key: "view", label: "View user", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_USER, onClick: (u) => openForm("view", u) },
      { key: "edit", label: "Edit user", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_USER, onClick: (u) => openForm("edit", u) },
      {
        key: "delete",
        label: "Delete user",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_USER,
        onClick: (u) => {
          setPendingDelete({ mode: "ids", ids: [u.id] });
          setDeleteCount(1);
          setDeleteNames([u.user.name || "-"]);
        }
      }
    ],
    []
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<GxpUser>
        table={table}
        columnDefs={columnDefs}
        tableName={t("gxpUsers")}
        searchPlaceholder="Search users…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        titleExtra={<Switch label={t("includeDisabled")} checked={includeDisabled} onChange={setIncludeDisabled} />}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("gxpUsers") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_USER,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No users found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="m-4 max-h-[calc(100dvh-2rem)] max-w-[1000px] overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <GxpUserForm
          mode={formMode}
          initialData={active}
          onClose={handleClose}
          onSubmit={handleSave}
          submitting={createUser.isPending || updateUser.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={deleteCount > 1 ? `Are you sure you want to delete these ${deleteCount} users?` : "Are you sure you want to delete this user?"}
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

export default GxpUserList;
