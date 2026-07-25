import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
// Shared, read-only dependency (also used by access-management's own roles page).
import CreateRoleModal from "@/pages/access-management/roles-and-permissions/CreateRoleModal";
import { PermissionType, RoleType } from "@/utils/common.constants";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { roleKeys, useBulkDeleteRole, useCreateRole, useRolePermissions, useUpdateRole } from "./Role.queries";
import { fetchRoleList } from "./Role.api";
import { getRoleColumns } from "./Role.columns";
import { getRolePermissionNames, type GxpRole } from "./Role.types";
import type { BulkSelection } from "@/lib/query/listTypes";

type RoleModalMode = "create" | "edit" | "view";

/** GXP Roles list — migrated structure-only; role form is the shared CreateRoleModal. */
const RoleList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<GxpRole | null>(null);
  const [mode, setMode] = useState<RoleModalMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<GxpRole>({
    entity: "gxpRole",
    queryKey: roleKeys.all,
    fetchList: fetchRoleList
  });

  const { data: rolePermissions = [] } = useRolePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const bulkDelete = useBulkDeleteRole();
  const busy = createRole.isPending || updateRole.isPending || bulkDelete.isPending;

  const columnDefs = useMemo(() => getRoleColumns({ t }), [t]);

  const openForm = (m: RoleModalMode, role: GxpRole | null) => {
    setMode(m);
    setActive(role);
    openModal();
  };
  const handleClose = () => {
    closeModal();
    setActive(null);
    setMode("create");
  };

  // Preserve pre-migration behaviour: the modal returns permission NAMES; map to ids.
  const handleSave = async (data: { roleName: string; permissions: string[] }) => {
    const permissionIds = data.permissions
      .map((name) => rolePermissions.find((p) => p.name === name)?.id)
      .filter((id): id is string => Boolean(id));
    const payload = { name: data.roleName.trim(), permissions: permissionIds, type: RoleType.GXP_SERVICE };
    if (active) {
      await updateRole.mutateAsync({ id: active.id, payload });
    } else {
      await createRole.mutateAsync(payload);
    }
    handleClose();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete roles" : "Delete role"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_ROLE,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids" ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.name) : []
          );
        }
      }
    ],
    [table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpRole>[]>(
    () => [
      { key: "view", label: "View role", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_ROLE, onClick: (role) => openForm("view", role) },
      { key: "edit", label: "Edit role", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_ROLE, onClick: (role) => openForm("edit", role) },
      {
        key: "delete",
        label: "Delete role",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_ROLE,
        onClick: (role) => {
          setPendingDelete({ mode: "ids", ids: [role.id] });
          setDeleteCount(1);
          setDeleteNames([role.name]);
        }
      }
    ],
    [openForm]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DataTable<GxpRole>
        table={table}
        columnDefs={columnDefs}
        tableName={t("rolesAndPermissions")}
        searchPlaceholder="Search roles…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("role") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_ROLE,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No roles found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="m-4 max-h-[100rem] max-w-[900px] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateRoleModal
          onClose={handleClose}
          onSubmit={({ name, permissions }) => handleSave({ roleName: name, permissions })}
          activeRole={active ? { name: active.name, permissions: getRolePermissionNames(active).map((name) => ({ name })) } : undefined}
          permissions={rolePermissions.map((p) => p.name)}
          permissionType={PermissionType.GXP_SERVICE}
          mode={mode}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={deleteCount > 1 ? `Are you sure you want to delete these ${deleteCount} roles?` : "Are you sure you want to delete this role?"}
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

export default RoleList;
