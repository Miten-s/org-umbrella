import DataTable, { type DataTableBulkAction, type DataTableTab } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { EyeIcon, LockIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { userKeys, useBulkDeleteUser, useBulkUpdateUser, useCreateUser, useUpdateUser } from "./User.queries";
import { fetchUserById, fetchUserList } from "./User.api";
import { getUserColumns, getUserDisplayName } from "./User.columns";
import UserForm, { type UserFormMode } from "./UserForm";
import type { User } from "./User.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/**
 * Users module (STANDARDS.md §12 step 3c). Proves: AsyncSelect reference
 * dropdowns (Location/Designation/Department), and Active/Inactive tabs as
 * server-side filters gated behind `canFilter`.
 *
 * Capability flags (see capabilities.ts, entity "user"): canSort=false,
 * canFilter=false, canBulkByFilter=false, canFetchById=false, canFacetCounts=false.
 * Backend `/auth/users` supports only page/limit/search today, so sort headers,
 * the tabs, and "select all matching" are HIDDEN (not faked). See BACKEND_ASKS.
 *
 * Bulk Edit/View only — Copy is deliberately not wired up yet for Users (email +
 * password can't auto-suffix like a plain name field can); see the plan doc.
 */
const UserList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  // Set instead of active/formMode while the multi-record View/Edit steppers are open.
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const table = useServerTable<User>({
    entity: "user",
    queryKey: userKeys.all,
    fetchList: fetchUserList
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const bulkDelete = useBulkDeleteUser();
  const bulkUpdate = useBulkUpdateUser();
  const busy = createUser.isPending || updateUser.isPending || bulkDelete.isPending || bulkUpdate.isPending;

  const columnDefs = useMemo(() => getUserColumns({ t }), [t]);

  const openForm = (mode: UserFormMode, user: User | null) => {
    setFormMode(mode);
    setActive(user);
    openModal();
  };

  const openView = (ids: string[]) => {
    setViewIds(ids);
    openModal();
  };

  const openEdit = (ids: string[]) => {
    setEditIds(ids);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
    setViewIds(null);
    setEditIds(null);
  };

  const handleSave = async (payload: Record<string, unknown>) => {
    if (active) {
      await updateUser.mutateAsync({ id: active.id, payload });
    } else {
      await createUser.mutateAsync(payload);
    }
    handleCloseForm();
  };

  const handleSaveEdits = async (updates: { id: string; payload: Record<string, unknown> }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleCloseForm();
    table.clearSelection();
  };

  // Tabs map to a server-side status filter. Rendered only when canFilter (§10);
  // dormant today because backend `/auth/users` has no status filter yet.
  const tabs = useMemo<DataTableTab[]>(
    () => [
      { key: "all", label: "All", filter: { status: undefined } },
      { key: "active", label: t("active"), filter: { status: "active" } },
      { key: "inactive", label: "Inactive", filter: { status: "disabled" } }
    ],
    [t]
  );

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View users" : "View user"),
        icon: EyeIcon,
        variant: "outline",
        permission: "VIEW:USER",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to view multiple records.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "edit",
        label: (count) => (count > 1 ? "Edit users" : "Edit user"),
        icon: PencilIcon,
        variant: "outline",
        permission: "UPDATE:USER",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to edit multiple records.", "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete users" : "Delete user"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: "DELETE:USER",
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => getUserDisplayName(row))
              : []
          );
        }
      }
    ],
    [table.rows]
  );

  const rowActions = useMemo<AppDataTableRowAction<User>[]>(
    () => [
      {
        key: "view",
        label: "View user",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:USER",
        onClick: (user) => openForm("view", user)
      },
      {
        key: "edit",
        label: "Edit user",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:USER",
        onClick: (user) => openForm("edit", user)
      },
      {
        key: "delete",
        label: "Delete user",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: "DELETE:USER",
        onClick: (user) => {
          setPendingDelete({ mode: "ids", ids: [user.id] });
          setDeleteCount(1);
          setDeleteNames([getUserDisplayName(user)]);
        }
      },
      {
        key: "reset-password",
        label: "Reset password",
        icon: LockIcon,
        placement: "menu",
        permission: "UPDATE:USER",
        onClick: () => {
          toast("Reset password will be connected when the API is ready.", "success");
        }
      }
    ],
    [openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<User>
        table={table}
        columnDefs={columnDefs}
        tableName={t("users")}
        searchPlaceholder="Search users…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        tabs={tabs}
        defaultTabKey="all"
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: "New user",
            icon: PlusIcon,
            variant: "primary",
            permission: ["CREATE:USER", "VIEW:DEPARTMENT", "VIEW:DESIGNATION", "VIEW:LOCATION"],
            permissionLogic: "all",
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("noAdminsFound") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[calc(100dvh-2rem)] max-w-[1000px] overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        {viewIds ? (
          <ViewStepper<User>
            ids={viewIds}
            fetchById={fetchUserById}
            FormComponent={UserForm}
            onClose={handleCloseForm}
            entityLabel={t("user")}
          />
        ) : editIds ? (
          <EditStepper<User, Record<string, unknown>>
            ids={editIds}
            fetchById={fetchUserById}
            FormComponent={UserForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("user")}
          />
        ) : (
          <UserForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
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
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} users?`
            : "Are you sure you want to delete this user?"
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

export default UserList;
