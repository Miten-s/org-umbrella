import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  gxpUserKeys,
  useBulkCopyGxpUser,
  useBulkDeleteGxpUser,
  useBulkRestoreGxpUser,
  useBulkUpdateGxpUser,
  useCreateGxpUser,
  useToggleGxpUserStatus,
  useUpdateGxpUser
} from "./GxpUser.queries";
import { fetchGxpUserById, fetchGxpUserList } from "./GxpUser.api";
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
  // Set instead of active/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);

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
  const bulkCopy = useBulkCopyGxpUser();
  const bulkDelete = useBulkDeleteGxpUser();
  const bulkUpdate = useBulkUpdateGxpUser();
  const bulkRestore = useBulkRestoreGxpUser();
  const toggleStatus = useToggleGxpUserStatus();
  const busy =
    createUser.isPending ||
    updateUser.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see GxpUser.columns.tsx).
  const columnDefs = useMemo(() => getGxpUserColumns({ t }), [t]);

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (user: GxpUser) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(user);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: GxpUserFormMode, user: GxpUser | null) => {
    setFormMode(mode);
    setActive(user);
    openModal();
  };

  const openCopy = useCallback(
    (ids: string[]) => {
      setCopyIds(ids);
      openModal();
    },
    [openModal]
  );

  const openView = useCallback(
    (ids: string[]) => {
      setViewIds(ids);
      openModal();
    },
    [openModal]
  );

  const openEdit = useCallback(
    (ids: string[]) => {
      setEditIds(ids);
      openModal();
    },
    [openModal]
  );

  const handleClose = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSave = async (payload: GxpUserPayload) => {
    if (active) {
      await updateUser.mutateAsync({ id: active.id, payload });
    } else {
      await createUser.mutateAsync(payload);
    }
    handleClose();
  };

  const handleSaveCopies = async (payloads: GxpUserPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleClose();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: GxpUserPayload }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleClose();
    table.clearSelection();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View users" : "View user"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_USER,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to view.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy users" : "Copy user"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_USER,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to copy.", "error");
            return;
          }
          openCopy(selection.ids);
        }
      },
      {
        key: "edit",
        label: (count) => (count > 1 ? "Edit users" : "Edit user"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_USER,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to edit.", "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: (count) => (count > 1 ? "Restore users" : "Restore user"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_USER,
        hidden: (rows) => !(rows as GxpUser[]).some((row) => row.status === "disabled"),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.user.name || "-"));
        }
      },
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
    [openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpUser>[]>(
    () => [
      { key: "view", label: "View user", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_USER, onClick: (u) => openForm("view", u) },
      { key: "edit", label: "Edit user", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_USER, onClick: (u) => openForm("edit", u) },
      {
        key: "clone", label: "Copy user", icon: CopyIcon, placement: "menu", permission: GXP_PERMISSIONS.CREATE_USER,
        onClick: (u) => openCopy([u.id])
      },
      {
        key: "restore", label: "Restore user", icon: CopyIcon, placement: "menu", permission: GXP_PERMISSIONS.UPDATE_USER,
        hidden: (u) => u.status !== "disabled",
        onClick: (u) => { setPendingRestore({ mode: "ids", ids: [u.id] }); setRestoreNames([u.user.name || "-"]); }
      },
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
    [openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<GxpUser>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
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
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<GxpUser, GxpUserPayload>
            ids={copyIds}
            fetchById={fetchGxpUserById}
            FormComponent={GxpUserForm}
            onSaveAll={handleSaveCopies}
            onClose={handleClose}
            saving={bulkCopy.isPending}
            entityLabel={t("gxpUsers")}
          />
        ) : viewIds ? (
          <ViewStepper<GxpUser>
            ids={viewIds}
            fetchById={fetchGxpUserById}
            FormComponent={GxpUserForm}
            onClose={handleClose}
            entityLabel={t("gxpUsers")}
          />
        ) : editIds ? (
          <EditStepper<GxpUser, GxpUserPayload>
            ids={editIds}
            fetchById={fetchGxpUserById}
            FormComponent={GxpUserForm}
            onSaveAll={handleSaveEdits}
            onClose={handleClose}
            saving={bulkUpdate.isPending}
            entityLabel={t("gxpUsers")}
          />
        ) : (
          <GxpUserForm
            mode={formMode}
            initialData={active}
            onClose={handleClose}
            onSubmit={handleSave}
            submitting={createUser.isPending || updateUser.isPending}
          />
        )}
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

      <ConfirmDialog
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        loading={bulkRestore.isPending}
        items={restoreNames}
        description={restoreNames.length > 1 ? `Are you sure you want to restore these ${restoreNames.length} users?` : "Are you sure you want to restore this user?"}
        onConfirm={async () => {
          if (pendingRestore) {
            await bulkRestore.mutateAsync(pendingRestore);
            table.clearSelection();
          }
          setPendingRestore(null);
        }}
      />
    </div>
  );
};

export default GxpUserList;
